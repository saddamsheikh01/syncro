"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import { MapPostCard } from "@/features/social/lists/MapPostCard";
import type { PostComposerPayload } from "@/features/social/sections/PostComposerModal";
import { PostComposerModal } from "@/features/social/sections/PostComposerModal";
import { useAuth, useFeed, usePosition, useT, useUser } from "@/hooks";
import { uploadPostMedia } from "@/services/media";
import { createPost, deletePost as deletePostRequest } from "@/services/social";
import { getUserSummary } from "@/services/users";
import type { JsonValue } from "@/types/shared";
import type { CreatePostRequest, PostScope, PostTimeframe } from "@/types/social";
import type { UserSummaryResponse } from "@/types/profile";

const DEFAULT_PAGE_SIZE = 10;
/** Retries for post media upload (e.g. large videos); total attempts = 1 + this value. */
const POST_MEDIA_UPLOAD_RETRIES = 2;

const readNumber = (value: JsonValue | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readBoolean = (value: JsonValue | undefined) =>
  typeof value === "boolean" ? value : undefined;

/** Parse radius from preferences (may be stored as number or string). */
const readRadiusKm = (value: JsonValue | undefined): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0)
    return value;
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return undefined;
};

type Translator = (
  key: string,
  params?: Record<string, string | number>
) => string;

const formatAuthorName = (t: Translator, userId: string) => {
  if (!userId) return t("Syncro user");
  return t("User {id}", { id: userId.slice(0, 6).toUpperCase() });
};

const formatCoordinate = (value: number | null | undefined) => {
  if (typeof value !== "number") return "";
  return value.toFixed(4);
};

const SCOPE_OPTION_KEYS = [
  { labelKey: "All", value: "" },
  { labelKey: "Friendship", value: "AMICIZIA" },
  { labelKey: "Experiences", value: "ESPERIENZE" },
  { labelKey: "Work", value: "LAVORO" },
  { labelKey: "Wellness", value: "BENESSERE" },
];

const TIMEFRAME_OPTION_KEYS = [
  { labelKey: "All", value: "" },
  { labelKey: "Now", value: "ORA" },
  { labelKey: "Today", value: "OGGI" },
];

const NEAR_YOU_RADIUS_OPTIONS = [
  { labelKey: "10 km", value: 10 },
  { labelKey: "25 km", value: 25 },
  { labelKey: "50 km", value: 50 },
  { labelKey: "100 km", value: 100 },
] as const;

const GENDER_OPTION_KEYS = [
  { labelKey: "All", value: "" },
  { labelKey: "Female", value: "FEMALE" },
  { labelKey: "Male", value: "MALE" },
  { labelKey: "Non-binary", value: "NON_BINARY" },
  { labelKey: "Other", value: "OTHER" },
  { labelKey: "Prefer not to say", value: "PREFER_NOT_TO_SAY" },
];

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

const resolveUploadErrorReason = (t: Translator, error: unknown) => {
  if (!error || typeof error !== "object") return t("Upload failed");
  const candidate = error as {
    code?: string;
    status?: number;
    message?: string;
  };
  if (candidate.status === 413) {
    return t("File exceeds the upload size limit.");
  }
  if (candidate.code === "TIMEOUT") {
    return t("Upload timeout. Try again with a stable connection.");
  }
  if (candidate.code === "NETWORK_ERROR") {
    return t("Network error during upload.");
  }
  if (candidate.message) {
    return candidate.message;
  }
  return t("Upload failed");
};

/** Get current browser position; rejects if unavailable or denied. */
const getBrowserPosition = (): Promise<{ latitude: number; longitude: number; accuracyMeters?: number }> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const uploadPostMediaWithRetry = async (
  postId: string,
  file: File,
  retries = POST_MEDIA_UPLOAD_RETRIES
) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await uploadPostMedia({ postId, file });
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(350 * (attempt + 1));
      }
    }
  }

  throw lastError;
};

type UploadFailure = {
  name: string;
  reason: string;
};

const formatUploadFailureError = (
  t: Translator,
  failures: Array<{ name: string; reason: string }>
) => {
  if (failures.length === 0) {
    return t("Unable to publish the post because media upload failed.");
  }
  const listed = failures
    .slice(0, 3)
    .map((failure) => `${failure.name}: ${failure.reason}`);
  const suffix =
    failures.length > 3
      ? ` ${t("(+{count} more)", { count: failures.length - 3 })}`
      : "";
  return t("Unable to publish the post because media upload failed. {details}", {
    details: `${listed.join(" | ")}${suffix}`,
  });
};

export const Feed = () => {
  const router = useRouter();
  const { t } = useT();
  const { status, user, actions: authActions } = useAuth();
  const { preferences, profile, language, actions: userActions } = useUser();
  const {
    position,
    hasPosition,
    loading: positionLoading,
    actions: positionActions,
  } = usePosition();
  const {
    items,
    loading,
    error,
    page,
    hasMore,
    actions: feedActions,
  } = useFeed();
  const [authorSummaries, setAuthorSummaries] = useState<
    Record<string, UserSummaryResponse>
  >({});

  const bootstrappedRef = useRef(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<"" | PostScope>("");
  const [timeframeFilter, setTimeframeFilter] = useState<"" | PostTimeframe>("");
  const [cityFilter, setCityFilter] = useState("");
  const [ageMinFilter, setAgeMinFilter] = useState("");
  const [ageMaxFilter, setAgeMaxFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [minCompatibility, setMinCompatibility] = useState("");
  const [nearYouFilter, setNearYouFilter] = useState(true);
  const [radiusFilter, setRadiusFilter] = useState<number>(25);
  const [activeFilters, setActiveFilters] = useState({
    scope: "",
    timeframe: "",
    city: "",
    minAge: "",
    maxAge: "",
    gender: "",
    minCompatibility: "",
    onlyNearby: true,
    radiusKm: 25,
  });

  useEffect(() => {
    authActions.hydrate();
  }, [authActions]);

  useEffect(() => {
    if (status !== "authenticated" || bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    userActions.fetchPreferences().catch(() => undefined);
    userActions.fetchProfile().catch(() => undefined);
    positionActions.hydrate();
    positionActions.fetchPosition().catch(() => undefined);
  }, [positionActions, status, userActions]);

  const preferencesSyncedRef = useRef(false);
  useEffect(() => {
    if (preferencesSyncedRef.current || preferences == null) return;
    preferencesSyncedRef.current = true;
    const stored = (preferences.feedPreferences ?? {}) as Record<string, JsonValue>;
    const onlyNearby = readBoolean(stored.onlyNearby) ?? true;
    const radius = readRadiusKm(stored.radiusKm) ?? 25;
    setNearYouFilter(onlyNearby);
    setRadiusFilter(radius);
    setActiveFilters((prev) => ({ ...prev, onlyNearby, radiusKm: radius }));
  }, [preferences]);

  const handleApplyFilters = () => {
    setActiveFilters({
      scope: scopeFilter,
      timeframe: timeframeFilter,
      city: cityFilter.trim(),
      minAge: ageMinFilter.trim(),
      maxAge: ageMaxFilter.trim(),
      gender: genderFilter,
      minCompatibility: minCompatibility.trim(),
      onlyNearby: nearYouFilter,
      radiusKm: radiusFilter,
    });
  };

  const handleResetFilters = () => {
    setScopeFilter("");
    setTimeframeFilter("");
    setCityFilter("");
    setAgeMinFilter("");
    setAgeMaxFilter("");
    setGenderFilter("");
    setMinCompatibility("");
    setNearYouFilter(false);
    setRadiusFilter(25);
    setActiveFilters({
      scope: "",
      timeframe: "",
      city: "",
      minAge: "",
      maxAge: "",
      gender: "",
      minCompatibility: "",
      onlyNearby: false,
      radiusKm: 25,
    });
  };

  const feedFilters = useMemo(() => {
    const onlyNearby = activeFilters.onlyNearby ?? true;
    const radiusKm =
      typeof activeFilters.radiusKm === "number" && activeFilters.radiusKm > 0
        ? activeFilters.radiusKm
        : 25;

    const useCityFilter = activeFilters.city.trim().length > 0;
    const locationFilters =
      !useCityFilter && onlyNearby && hasPosition && position
        ? {
            lat: position.latitude ?? undefined,
            lng: position.longitude ?? undefined,
            radiusKm,
          }
        : {};

    const minAge = Number.parseInt(activeFilters.minAge, 10);
    const maxAge = Number.parseInt(activeFilters.maxAge, 10);
    const minCompatibilityValue = Number.parseInt(
      activeFilters.minCompatibility,
      10
    );

    return {
      ...locationFilters,
      scope: (activeFilters.scope || undefined) as PostScope | undefined,
      timeframe: (activeFilters.timeframe || undefined) as
        | PostTimeframe
        | undefined,
      city: useCityFilter ? activeFilters.city : undefined,
      minAge: Number.isFinite(minAge) ? minAge : undefined,
      maxAge: Number.isFinite(maxAge) ? maxAge : undefined,
      gender: activeFilters.gender || undefined,
      minCompatibility: Number.isFinite(minCompatibilityValue)
        ? minCompatibilityValue
        : undefined,
    };
  }, [activeFilters, hasPosition, position]);

  const feedFilterKey = useMemo(
    () => JSON.stringify(feedFilters),
    [feedFilters]
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    feedActions.resetFeed();
    feedActions
      .fetchFeed({ ...feedFilters, page: 0, size: DEFAULT_PAGE_SIZE })
      .catch(() => undefined);
  }, [feedActions, feedFilterKey, feedFilters, status]);

  const handleEditPost = useCallback(
    async (
      postId: string,
      payload: { content: string; mediaToDelete?: string[]; newFiles?: File[] }
    ) => {
      setPostActionError(null);
      try {
        await feedActions.editPost(postId, payload);
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          t("Error while updating the post.")
        );
        setPostActionError(message);
        throw new Error(message);
      }
    },
    [feedActions, t]
  );

  const handleDeletePost = useCallback(
    async (postId: string) => {
      setPostActionError(null);
      try {
        await feedActions.deletePost(postId);
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          t("Error while deleting the post.")
        );
        setPostActionError(message);
        throw new Error(message);
      }
    },
    [feedActions, t]
  );

  const postItems = useMemo(() => {
    const profileName = profile?.fullName?.trim();
    const selfName = profileName || user?.email || t("You");

    return items.map((post) => ({
      post,
      matchScore:
        user?.id && post.userId === user.id
          ? undefined
          : typeof post.matchScore === "number"
            ? post.matchScore
            : undefined,
      authorName:
        user?.id && post.userId === user.id
          ? selfName
          : authorSummaries[post.userId]?.fullName ??
            authorSummaries[post.userId]?.username ??
            formatAuthorName(t, post.userId),
      authorSubtitle:
        authorSummaries[post.userId]?.city ??
        authorSummaries[post.userId]?.country ??
        undefined,
      avatarUrl: authorSummaries[post.userId]?.avatarUrl ?? undefined,
      currentUserId: user?.id,
      onReact: feedActions.reactToPost,
      onRemoveReaction: feedActions.removeReaction,
      onToggleFavorite: feedActions.toggleFavorite,
      onEditPost: handleEditPost,
      onDeletePost: handleDeletePost,
      onProfileClick: () => router.push(`/profile/${post.userId}`),
    }));
  }, [
    handleDeletePost,
    handleEditPost,
    feedActions.reactToPost,
    feedActions.removeReaction,
    feedActions.toggleFavorite,
    items,
    profile?.fullName,
    t,
    user?.email,
    user?.id,
    authorSummaries,
    router,
  ]);

  useEffect(() => {
    if (status !== "authenticated" || items.length === 0) return;
    const uniqueIds = Array.from(new Set(items.map((post) => post.userId)));
    const missingIds = uniqueIds.filter(
      (id) => id && !authorSummaries[id]
    );
    if (missingIds.length === 0) return;
    let active = true;
    Promise.all(
      missingIds.map(async (id) => {
        try {
          const summary = await getUserSummary(id);
          return { id, summary };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!active) return;
      setAuthorSummaries((prev) => {
        const next = { ...prev };
        results.forEach((item) => {
          if (item?.summary) {
            next[item.id] = item.summary;
          }
        });
        return next;
      });
    });
    return () => {
      active = false;
    };
  }, [items, status, user?.id, authorSummaries]);

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    feedActions
      .fetchFeed(
        { ...feedFilters, page: page + 1, size: DEFAULT_PAGE_SIZE },
        { append: true }
      )
      .catch(() => undefined);
  };

  const handleOpenComposer = () => {
    setComposerError(null);
    setComposerOpen(true);
    positionActions.fetchPosition().catch(() => undefined);
  };

  const handleCloseComposer = () => {
    if (composerLoading) return;
    setComposerOpen(false);
  };

  const handleComposerSubmit = async (payload: PostComposerPayload) => {
    setComposerError(null);
    setComposerLoading(true);

    try {
      const request: CreatePostRequest = {
        content: payload.content,
        language: language ?? undefined,
        scope: payload.scope ?? null,
        mood: payload.mood ?? null,
        timeframe: payload.timeframe ?? null,
        taggedUserIds: payload.taggedUserIds ?? undefined,
      };

      let positionToUse = payload.includePosition && hasPosition && position ? position : null;
      if (payload.includePosition && !positionToUse) {
        try {
          const browserPos = await getBrowserPosition();
          const saved = await positionActions.savePosition({
            latitude: browserPos.latitude,
            longitude: browserPos.longitude,
            accuracyMeters: browserPos.accuracyMeters ?? null,
          });
          positionToUse = saved;
        } catch {
          setComposerError(t("Enable location to use it in posts."));
          setComposerLoading(false);
          return;
        }
      }
      if (positionToUse) {
        request.latitude = positionToUse.latitude ?? null;
        request.longitude = positionToUse.longitude ?? null;
      }

      const created = await createPost(request);

      if (payload.files.length) {
        const failures: UploadFailure[] = [];
        for (const file of payload.files) {
          try {
            await uploadPostMediaWithRetry(created.id, file);
          } catch (mediaError) {
            failures.push({
              name: file.name,
              reason: resolveUploadErrorReason(t, mediaError),
            });
            break;
          }
        }

        if (failures.length > 0) {
          let rollbackError: unknown = null;
          try {
            await deletePostRequest(created.id);
          } catch (error) {
            rollbackError = error;
          }

          const uploadErrorMessage = formatUploadFailureError(t, failures);
          if (rollbackError) {
            const rollbackReason = resolveErrorMessage(
              rollbackError,
              t("Rollback failed")
            );
            throw new Error(
              t(
                "{uploadError} The post text may still exist because automatic rollback failed ({reason}).",
                { uploadError: uploadErrorMessage, reason: rollbackReason }
              )
            );
          }

          throw new Error(uploadErrorMessage);
        }
      }

      setComposerOpen(false);
      feedActions
        .fetchFeed({ ...feedFilters, page: 0, size: DEFAULT_PAGE_SIZE })
        .catch(() => undefined);
    } catch (submitError) {
      setComposerError(
        resolveErrorMessage(submitError, t("Error while publishing."))
      );
    } finally {
      setComposerLoading(false);
    }
  };

  const isInitialLoading = loading && items.length === 0;

  const onlyNearbyApplied = activeFilters.onlyNearby ?? true;
  const radiusKmApplied =
    typeof activeFilters.radiusKm === "number" && activeFilters.radiusKm > 0
      ? activeFilters.radiusKm
      : undefined;
  const positionLabel =
    hasPosition && position
      ? `${formatCoordinate(position.latitude)}, ${formatCoordinate(
          position.longitude
        )}`
      : undefined;

  const scopeOptions = useMemo(
    () =>
      SCOPE_OPTION_KEYS.map((option) => ({
        label: t(option.labelKey),
        value: option.value,
      })),
    [t]
  );

  const timeframeOptions = useMemo(
    () =>
      TIMEFRAME_OPTION_KEYS.map((option) => ({
        label: t(option.labelKey),
        value: option.value,
      })),
    [t]
  );

  const genderOptions = useMemo(
    () =>
      GENDER_OPTION_KEYS.map((option) => ({
        label: t(option.labelKey),
        value: option.value,
      })),
    [t]
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              {t("Feed")}
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              {t("Moments")}
            </h1>
            <p className="text-sm text-muted">
              {t("Discover localized and personalized content.")}
            </p>
          </div>
          <Button size="sm" onClick={handleOpenComposer}>
            {t("Create post")}
          </Button>
        </div>
      </header>

      {postActionError ? (
        <Card className="flex flex-wrap items-start justify-between gap-3 border-danger/30 bg-danger/10 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {t("Unable to complete post action")}
            </p>
            <p className="text-xs text-muted">{postActionError}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPostActionError(null)}
          >
            {t("Close")}
          </Button>
        </Card>
      ) : null}

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {t("Feed filters")}
            </p>
            <p className="text-xs text-subtle">
              {t("Customize what you want to see in the feed.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={handleResetFilters}>
              {t("Reset")}
            </Button>
            <Button size="sm" onClick={handleApplyFilters}>
              {t("Apply")}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              {t("Near you")}
            </label>
            <div className="flex h-11 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 shadow-sm">
              <span className="text-sm text-subtle">
                {nearYouFilter
                  ? t("Show posts near my location")
                  : t("Show all posts")}
              </span>
              <label className="relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={nearYouFilter}
                  onChange={(e) => setNearYouFilter(e.target.checked)}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-border/80 transition peer-checked:bg-accent" />
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-surface shadow-sm transition peer-checked:translate-x-4" />
              </label>
            </div>
          </div>
          {nearYouFilter ? (
            <Select
              label={t("Radius (km)")}
              options={NEAR_YOU_RADIUS_OPTIONS.map((opt) => ({
                label: t(opt.labelKey),
                value: String(opt.value),
              }))}
              value={String(radiusFilter)}
              onValueChange={(value) => {
                const n = Number.parseInt(value, 10);
                if (Number.isFinite(n) && n > 0) setRadiusFilter(n);
              }}
            />
          ) : null}
          <Select
            label={t("Scope")}
            options={scopeOptions}
            value={scopeFilter}
            onValueChange={(value) =>
              setScopeFilter(value as "" | PostScope)
            }
          />
          <Input
            label={t("City")}
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
            placeholder={t("Milan")}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t("Minimum age")}
              type="number"
              min={18}
              value={ageMinFilter}
              onChange={(event) => setAgeMinFilter(event.target.value)}
              placeholder="18"
            />
            <Input
              label={t("Maximum age")}
              type="number"
              min={18}
              value={ageMaxFilter}
              onChange={(event) => setAgeMaxFilter(event.target.value)}
              placeholder="45"
            />
          </div>
          <Select
            label={t("Gender")}
            options={genderOptions}
            value={genderFilter}
            onValueChange={setGenderFilter}
          />
          <Input
            label={t("Minimum compatibility")}
            type="number"
            min={0}
            max={100}
            value={minCompatibility}
            onChange={(event) => setMinCompatibility(event.target.value)}
            placeholder="50"
          />
        </div>
      </Card>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Badge tone="accent" size="sm">
          {onlyNearbyApplied ? t("Near you") : t("All posts")}
        </Badge>
        <Badge tone="neutral" size="sm">
          {t("Radius {value}", {
            value:
              onlyNearbyApplied && radiusKmApplied
                ? `${radiusKmApplied} km`
                : t("any"),
          })}
        </Badge>
        <Badge tone={hasPosition ? "success" : "warning"} size="sm">
          {hasPosition ? t("Location enabled") : t("Location unavailable")}
        </Badge>
        {positionLoading ? (
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-subtle">
            <Loader size="sm" />
            {t("Updating location")}
          </span>
        ) : null}
      </Card>

      {isInitialLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading feed...")}</p>
        </Card>
      ) : null}

      {error ? (
        <ErrorState
          title={t("Unable to load the feed")}
          description={error.message}
        />
      ) : null}

      {!isInitialLoading && !error && items.length === 0 ? (
        <EmptyState
          title={t("No posts available")}
          description={t("Come back later to see new content.")}
        />
      ) : null}

      {items.length ? <MapPostCard items={postItems} /> : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="md"
            onClick={handleLoadMore}
            loading={loading}
            loadingText={t("Loading")}
          >
            {t("Load more")}
          </Button>
        </div>
      ) : null}

      {composerOpen ? (
        <PostComposerModal
          open={composerOpen}
          loading={composerLoading}
          error={composerError}
          positionAvailable={true}
          positionLabel={positionLabel}
          onClose={handleCloseComposer}
          onSubmit={handleComposerSubmit}
        />
      ) : null}
    </div>
  );
};
