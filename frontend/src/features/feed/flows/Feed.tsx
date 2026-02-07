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
import { useAuth, useFeed, usePosition, useUser } from "@/hooks";
import { uploadPostMedia } from "@/services/media";
import { createPost } from "@/services/social";
import { getUserSummary } from "@/services/users";
import type { JsonValue } from "@/types/shared";
import type { CreatePostRequest, PostScope, PostTimeframe } from "@/types/social";
import type { UserSummaryResponse } from "@/types/profile";

const DEFAULT_PAGE_SIZE = 10;
const POST_MEDIA_UPLOAD_RETRIES = 1;

const readNumber = (value: JsonValue | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readBoolean = (value: JsonValue | undefined) =>
  typeof value === "boolean" ? value : undefined;

const formatAuthorName = (userId: string) => {
  if (!userId) return "Syncro user";
  return `User ${userId.slice(0, 6).toUpperCase()}`;
};

const formatCoordinate = (value: number | null | undefined) => {
  if (typeof value !== "number") return "";
  return value.toFixed(4);
};

const SCOPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Friendship", value: "AMICIZIA" },
  { label: "Experiences", value: "ESPERIENZE" },
  { label: "Work", value: "LAVORO" },
  { label: "Wellness", value: "BENESSERE" },
];

const TIMEFRAME_OPTIONS = [
  { label: "All", value: "" },
  { label: "Now", value: "ORA" },
  { label: "Today", value: "OGGI" },
];

const GENDER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Female", value: "FEMALE" },
  { label: "Male", value: "MALE" },
  { label: "Non-binary", value: "NON_BINARY" },
  { label: "Other", value: "OTHER" },
  { label: "Prefer not to say", value: "PREFER_NOT_TO_SAY" },
];

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

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

const formatUploadFailureNotice = (
  failures: Array<{ name: string; reason: string }>
) => {
  if (failures.length === 0) return null;
  const listed = failures
    .slice(0, 3)
    .map((failure) => `${failure.name}: ${failure.reason}`);
  const suffix =
    failures.length > 3 ? ` (+${failures.length - 3} more)` : "";
  return `Post published, but some media failed to upload. ${listed.join(
    " | "
  )}${suffix}`;
};

export const Feed = () => {
  const router = useRouter();
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
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<"" | PostScope>("");
  const [timeframeFilter, setTimeframeFilter] = useState<"" | PostTimeframe>("");
  const [cityFilter, setCityFilter] = useState("");
  const [ageMinFilter, setAgeMinFilter] = useState("");
  const [ageMaxFilter, setAgeMaxFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [minCompatibility, setMinCompatibility] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    scope: "",
    timeframe: "",
    city: "",
    minAge: "",
    maxAge: "",
    gender: "",
    minCompatibility: "",
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

  const handleApplyFilters = () => {
    setActiveFilters({
      scope: scopeFilter,
      timeframe: timeframeFilter,
      city: cityFilter.trim(),
      minAge: ageMinFilter.trim(),
      maxAge: ageMaxFilter.trim(),
      gender: genderFilter,
      minCompatibility: minCompatibility.trim(),
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
    setActiveFilters({
      scope: "",
      timeframe: "",
      city: "",
      minAge: "",
      maxAge: "",
      gender: "",
      minCompatibility: "",
    });
  };

  const feedFilters = useMemo(() => {
    const storedFeed = (preferences?.feedPreferences ?? {}) as Record<
      string,
      JsonValue
    >;
    const onlyNearby = readBoolean(storedFeed.onlyNearby) ?? true;
    const radiusKm = readNumber(storedFeed.radiusKm);

    const useCityFilter = activeFilters.city.trim().length > 0;
    const locationFilters =
      !useCityFilter && onlyNearby && hasPosition && position
        ? {
            lat: position.latitude ?? undefined,
            lng: position.longitude ?? undefined,
            radiusKm: radiusKm ?? undefined,
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
  }, [activeFilters, hasPosition, position, preferences]);

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
    async (postId: string, payload: { content: string }) => {
      setPostActionError(null);
      try {
        await feedActions.editPost(postId, payload);
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          "Error while updating the post."
        );
        setPostActionError(message);
        throw new Error(message);
      }
    },
    [feedActions]
  );

  const handleDeletePost = useCallback(
    async (postId: string) => {
      setPostActionError(null);
      try {
        await feedActions.deletePost(postId);
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          "Error while deleting the post."
        );
        setPostActionError(message);
        throw new Error(message);
      }
    },
    [feedActions]
  );

  const postItems = useMemo(() => {
    const profileName = profile?.fullName?.trim();
    const selfName = profileName || user?.email || "You";

    return items.map((post) => ({
      post,
      matchScore: typeof post.matchScore === "number" ? post.matchScore : undefined,
      authorName:
        user?.id && post.userId === user.id
          ? selfName
          : authorSummaries[post.userId]?.fullName ??
            authorSummaries[post.userId]?.username ??
            formatAuthorName(post.userId),
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
    setComposerNotice(null);
    setComposerOpen(true);
  };

  const handleCloseComposer = () => {
    if (composerLoading) return;
    setComposerOpen(false);
  };

  const handleComposerSubmit = async (payload: PostComposerPayload) => {
    setComposerError(null);
    setComposerNotice(null);
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

      if (payload.includePosition && hasPosition && position) {
        request.latitude = position.latitude ?? null;
        request.longitude = position.longitude ?? null;
      }

      const created = await createPost(request);

      if (payload.files.length) {
        const failures = (
          await Promise.all(
            payload.files.map(async (file) => {
              try {
                await uploadPostMediaWithRetry(created.id, file);
                return null;
              } catch (mediaError) {
                return {
                  name: file.name,
                  reason: resolveErrorMessage(
                    mediaError,
                    "Upload failed"
                  ),
                };
              }
            })
          )
        ).filter(
          (
            failure
          ): failure is {
            name: string;
            reason: string;
          } => failure !== null
        );

        const notice = formatUploadFailureNotice(failures);
        if (notice) {
          setComposerNotice(notice);
        }
      }

      setComposerOpen(false);
      feedActions
        .fetchFeed({ ...feedFilters, page: 0, size: DEFAULT_PAGE_SIZE })
        .catch(() => undefined);
    } catch (submitError) {
      setComposerError(
        resolveErrorMessage(submitError, "Error while publishing.")
      );
    } finally {
      setComposerLoading(false);
    }
  };

  const isInitialLoading = loading && items.length === 0;

  const storedFeed = (preferences?.feedPreferences ?? {}) as Record<
    string,
    JsonValue
  >;
  const onlyNearby = readBoolean(storedFeed.onlyNearby) ?? true;
  const radiusKm = readNumber(storedFeed.radiusKm);
  const positionLabel =
    hasPosition && position
      ? `${formatCoordinate(position.latitude)}, ${formatCoordinate(
          position.longitude
        )}`
      : undefined;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Feed
            </p>
            <h1 className="text-3xl font-semibold text-foreground">
              Posts near you
            </h1>
            <p className="text-sm text-muted">
              Discover localized and personalized content.
            </p>
          </div>
          <Button size="sm" onClick={handleOpenComposer}>
            Create post
          </Button>
        </div>
      </header>

      {composerNotice ? (
        <Card className="flex flex-wrap items-start justify-between gap-3 border-warning/30 bg-warning/15 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Media not uploaded
            </p>
            <p className="text-xs text-muted">{composerNotice}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setComposerNotice(null)}
          >
            Close
          </Button>
        </Card>
      ) : null}

      {postActionError ? (
        <Card className="flex flex-wrap items-start justify-between gap-3 border-danger/30 bg-danger/10 p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Unable to complete post action
            </p>
            <p className="text-xs text-muted">{postActionError}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPostActionError(null)}
          >
            Close
          </Button>
        </Card>
      ) : null}

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Feed filters
            </p>
            <p className="text-xs text-subtle">
              Customize what you want to see in the feed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={handleResetFilters}>
              Reset
            </Button>
            <Button size="sm" onClick={handleApplyFilters}>
              Apply
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Scope"
            options={SCOPE_OPTIONS}
            value={scopeFilter}
            onValueChange={(value) =>
              setScopeFilter(value as "" | PostScope)
            }
          />
          <Select
            label="Timeframe"
            options={TIMEFRAME_OPTIONS}
            value={timeframeFilter}
            onValueChange={(value) =>
              setTimeframeFilter(value as "" | PostTimeframe)
            }
          />
          <Input
            label="City"
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
            placeholder="Milan"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Minimum age"
              type="number"
              min={18}
              value={ageMinFilter}
              onChange={(event) => setAgeMinFilter(event.target.value)}
              placeholder="18"
            />
            <Input
              label="Maximum age"
              type="number"
              min={18}
              value={ageMaxFilter}
              onChange={(event) => setAgeMaxFilter(event.target.value)}
              placeholder="45"
            />
          </div>
          <Select
            label="Gender"
            options={GENDER_OPTIONS}
            value={genderFilter}
            onValueChange={setGenderFilter}
          />
          <Input
            label="Minimum compatibility"
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
          {onlyNearby ? "Nearby only" : "All posts"}
        </Badge>
        <Badge tone="neutral" size="sm">
          Radius {radiusKm ? `${radiusKm} km` : "any"}
        </Badge>
        <Badge tone={hasPosition ? "success" : "warning"} size="sm">
          {hasPosition ? "Location enabled" : "Location unavailable"}
        </Badge>
        {positionLoading ? (
          <span className="ml-auto inline-flex items-center gap-2 text-xs text-subtle">
            <Loader size="sm" />
            Updating location
          </span>
        ) : null}
      </Card>

      {isInitialLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Loading feed...</p>
        </Card>
      ) : null}

      {error ? (
        <ErrorState
          title="Unable to load the feed"
          description={error.message}
        />
      ) : null}

      {!isInitialLoading && !error && items.length === 0 ? (
        <EmptyState
          title="No posts available"
          description="Come back later to see new content."
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
            loadingText="Loading"
          >
            Load more
          </Button>
        </div>
      ) : null}

      {composerOpen ? (
        <PostComposerModal
          open={composerOpen}
          loading={composerLoading}
          error={composerError}
          positionAvailable={hasPosition}
          positionLabel={positionLabel}
          onClose={handleCloseComposer}
          onSubmit={handleComposerSubmit}
        />
      ) : null}
    </div>
  );
};
