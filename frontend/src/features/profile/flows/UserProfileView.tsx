"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { ProfileSummaryCard } from "@/features/profile/cards/ProfileSummaryCard";
import { MapPostCard } from "@/features/social/lists/MapPostCard";
import { ZyraProfileRecap } from "@/features/zyra/cards/ZyraProfileRecap";
import { TestCountCard } from "@/components/ui/TestCountCard";
import { useAnalytics, useAuth, useT, useUser } from "@/hooks";
import { getMatchWithUser } from "@/services/matches";
import { getUserTestsCount } from "@/services/insights";
import { getUserPosts, getUserProfile } from "@/services/users";
import { reactToPost, removeReaction } from "@/services/social";
import { addFavorite, removeFavorite } from "@/services/favorites";
import type { PostReactionType } from "@/types/social";
import type { UserPublicProfileResponse } from "@/types/profile";
import type { PostResponse } from "@/types/social";
import type { UserMatchResponse } from "@/types/matches";

const PAGE_SIZE = 6;

const RELATIONSHIP_LABELS: Record<string, string> = {
  SINGLE: "Single",
  IN_RELATIONSHIP: "In a relationship",
  MARRIED: "Married",
  SEPARATED: "Separated",
  COMPLICATED: "It's complicated",
  OTHER: "Other",
};

const ORIENTATION_LABELS: Record<string, string> = {
  HETERO: "Heterosexual",
  GAY: "Gay",
  BI: "Bisexual",
  ASEXUAL: "Asexual",
  OTHER: "Other",
};

const CHILDREN_LABELS: Record<string, string> = {
  NO_CHILDREN: "No children",
  HAS_CHILDREN: "Has children",
  WANTS_CHILDREN: "Wants children",
  DOES_NOT_WANT: "Does not want children",
  UNDECIDED: "Undecided",
};

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

const formatLocation = (
  profile: UserPublicProfileResponse | null,
  t: (key: string, values?: Record<string, string | number>) => string
) => {
  if (!profile) return undefined;
  const parts = [profile.city, profile.country].filter(Boolean);
  const location = parts.length ? parts.join(", ") : "";
  const ageLabel = profile.age ? t("{age} years", { age: profile.age }) : "";
  return [location, ageLabel].filter(Boolean).join(" - ") || undefined;
};

const resolveLabel = (value: string | null | undefined, map: Record<string, string>) =>
  value ? map[value] ?? value : null;

const updateReactionCounts = (
  reactions: PostResponse["reactions"],
  prevReaction: PostReactionType | null,
  nextReaction: PostReactionType | null
) => {
  const next = { ...(reactions ?? {}) } as Record<string, number>;
  if (prevReaction) {
    next[prevReaction] = Math.max(0, (next[prevReaction] ?? 0) - 1);
  }
  if (nextReaction) {
    next[nextReaction] = (next[nextReaction] ?? 0) + 1;
  }
  return next;
};

export interface UserProfileViewProps {
  userId: string;
}

export const UserProfileView = ({ userId }: UserProfileViewProps) => {
  const router = useRouter();
  const { status, user, actions: authActions } = useAuth();
  const { preferences, actions: userActions } = useUser();
  const { actions: analyticsActions } = useAnalytics();
  const { t } = useT();

  const [profile, setProfile] = useState<UserPublicProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [match, setMatch] = useState<UserMatchResponse | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  const [testsCount, setTestsCount] = useState<number | null>(null);
  const [testsCountLoading, setTestsCountLoading] = useState(false);

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [postsPage, setPostsPage] = useState(0);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const analyticsTrackedRef = useRef(false);

  useEffect(() => {
    authActions.hydrate();
    authActions.fetchMe().catch(() => undefined);
  }, [authActions]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (preferences) return;
    userActions.fetchPreferences().catch(() => undefined);
  }, [status, preferences, userActions]);

  // Traccia PROFILE_VIEWED quando il profilo è caricato
  useEffect(() => {
    if (!profile) return;
    if (analyticsTrackedRef.current) return;
    analyticsTrackedRef.current = true;
    analyticsActions
      .trackEvent({
        eventType: "PROFILE_VIEWED",
        payload: { profileUserId: profile.userId },
      })
      .catch(() => undefined);
  }, [profile, analyticsActions]);

  useEffect(() => {
    if (!userId) return;
    if (user?.id && user.id === userId) {
      router.push("/profile");
      return;
    }

    let active = true;
    setProfileLoading(true);
    setProfileError(null);
    setProfile(null);
    setMatch(null);
    setMatchError(null);
    setPosts([]);
    setPostsError(null);
    setPostsHasMore(false);
    setPostsPage(0);
    setTestsCount(null);
    setTestsCountLoading(false);

    getUserProfile(userId)
      .then((response) => {
        if (!active) return;
        setProfile(response);
        return response;
      })
      .then(() => {
        if (!active) return;
        setMatchLoading(true);
        setPostsLoading(true);
        setTestsCountLoading(true);

        const matchPromise = getMatchWithUser(userId)
          .then((response) => {
            if (!active) return;
            setMatch(response);
          })
          .catch(() => {
            if (!active) return;
            setMatchError("Match unavailable with the current settings.");
          })
          .finally(() => {
            if (!active) return;
            setMatchLoading(false);
          });

        const testsCountPromise = getUserTestsCount(userId)
          .then((response) => {
            if (!active) return;
            setTestsCount(response.count);
          })
          .catch(() => {
            if (!active) return;
            setTestsCount(null);
          })
          .finally(() => {
            if (!active) return;
            setTestsCountLoading(false);
          });

        const postsPromise = getUserPosts(userId, { page: 0, size: PAGE_SIZE })
          .then((response) => {
            if (!active) return;
            setPosts(response.content ?? []);
            setPostsPage(response.number ?? 0);
            setPostsHasMore(!response.last);
          })
          .catch((error) => {
            if (!active) return;
            setPostsError(resolveErrorMessage(error, "Unable to load posts"));
          })
          .finally(() => {
            if (!active) return;
            setPostsLoading(false);
          });

        return Promise.all([matchPromise, postsPromise, testsCountPromise]);
      })
      .catch((error) => {
        if (!active) return;
        setProfileError(
          resolveErrorMessage(error, "Profile unavailable")
        );
      })
      .finally(() => {
        if (!active) return;
        setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router, user?.id, userId]);

  const displayName = useMemo(() => {
    if (!profile) return t("Profile");
    return (
      profile.fullName?.trim() ||
      profile.username ||
      t("User {id}", { id: profile.userId.slice(0, 6) })
    );
  }, [profile, t]);

  const locationLabel = useMemo(() => formatLocation(profile, t), [profile, t]);
  const extendedSections = useMemo(
    () => [
      { label: t("What defines me"), value: profile?.traitsText ?? null },
      { label: t("What I love"), value: profile?.lovesText ?? null },
      { label: t("What I can't stand"), value: profile?.dislikesText ?? null },
      { label: t("What I'm looking for"), value: profile?.goalsText ?? null },
      { label: t("Values"), value: profile?.valuesText ?? null },
    ],
    [profile, t]
  );
  const personalSections = useMemo(
    () => [
      {
        label: t("Relationship status"),
        value: (() => {
          const label = resolveLabel(profile?.relationshipStatus, RELATIONSHIP_LABELS);
          return label ? t(label) : null;
        })(),
      },
      {
        label: t("Orientation"),
        value: (() => {
          const label = resolveLabel(profile?.orientation, ORIENTATION_LABELS);
          return label ? t(label) : null;
        })(),
      },
      {
        label: t("Children"),
        value: (() => {
          const label = resolveLabel(profile?.childrenStatus, CHILDREN_LABELS);
          return label ? t(label) : null;
        })(),
      },
    ],
    [profile, t]
  );
  const filledExtendedSections = useMemo(
    () => extendedSections.filter((item) => item.value && item.value.trim().length > 0),
    [extendedSections]
  );
  const filledPersonalSections = useMemo(
    () => personalSections.filter((item) => item.value && item.value.trim().length > 0),
    [personalSections]
  );
  const hasExtendedContent = useMemo(
    () => filledExtendedSections.length > 0 || filledPersonalSections.length > 0,
    [filledExtendedSections, filledPersonalSections]
  );
  const fallbackBio = profile?.bio?.trim();
  const resolvedMatchScore = useMemo(() => {
    if (typeof match?.scoreTotal !== "number" || !Number.isFinite(match.scoreTotal)) {
      return undefined;
    }
    return Math.round(match.scoreTotal);
  }, [match?.scoreTotal]);


  const updatePost = useCallback(
    (postId: string, updater: (post: PostResponse) => PostResponse) => {
      setPosts((prev) => prev.map((post) => (post.id === postId ? updater(post) : post)));
    },
    []
  );

  const handleReactToPost = useCallback(
    async (postId: string, reaction: PostReactionType) => {
      let previousReaction: PostReactionType | null = null;
      updatePost(postId, (post) => {
        previousReaction = post.myReaction ?? null;
        return {
          ...post,
          myReaction: reaction,
          reactions: updateReactionCounts(post.reactions, previousReaction, reaction),
          likedByMe: reaction === "LIKE",
          likeCount:
            reaction === "LIKE"
              ? post.likeCount + (previousReaction === "LIKE" ? 0 : 1)
              : previousReaction === "LIKE"
                ? Math.max(0, post.likeCount - 1)
                : post.likeCount,
        };
      });

      try {
        await reactToPost(postId, reaction);
      } catch {
        updatePost(postId, (post) => ({
          ...post,
          myReaction: previousReaction,
          reactions: updateReactionCounts(post.reactions, reaction, previousReaction),
          likedByMe: previousReaction === "LIKE",
          likeCount:
            previousReaction === "LIKE"
              ? post.likeCount + (reaction === "LIKE" ? 0 : 1)
              : reaction === "LIKE"
                ? Math.max(0, post.likeCount - 1)
                : post.likeCount,
        }));
      }
    },
    [updatePost]
  );

  const handleRemoveReaction = useCallback(
    async (postId: string) => {
      let previousReaction: PostReactionType | null = null;
      updatePost(postId, (post) => {
        previousReaction = post.myReaction ?? null;
        return {
          ...post,
          myReaction: null,
          reactions: updateReactionCounts(post.reactions, previousReaction, null),
          likedByMe: false,
          likeCount:
            previousReaction === "LIKE"
              ? Math.max(0, post.likeCount - 1)
              : post.likeCount,
        };
      });

      try {
        await removeReaction(postId);
      } catch {
        updatePost(postId, (post) => ({
          ...post,
          myReaction: previousReaction,
          reactions: updateReactionCounts(post.reactions, null, previousReaction),
          likedByMe: previousReaction === "LIKE",
          likeCount:
            previousReaction === "LIKE"
              ? post.likeCount + 1
              : post.likeCount,
        }));
      }
    },
    [updatePost]
  );

  const handleToggleFavorite = useCallback(
    async (postId: string, nextActive: boolean) => {
      updatePost(postId, (post) => ({
        ...post,
        favoritedByMe: nextActive,
      }));

      try {
        if (nextActive) {
          await addFavorite({ postId });
        } else {
          await removeFavorite({ postId });
        }
      } catch {
        updatePost(postId, (post) => ({
          ...post,
          favoritedByMe: !nextActive,
        }));
      }
    },
    [updatePost]
  );

  const postItems = useMemo(
    () =>
      posts.map((post) => ({
        post,
        matchScore: typeof post.matchScore === "number" ? post.matchScore : undefined,
        authorName: displayName,
        authorSubtitle: locationLabel,
        avatarUrl: profile?.avatarUrl ?? undefined,
        currentUserId: user?.id,
        onReact: handleReactToPost,
        onRemoveReaction: handleRemoveReaction,
        onToggleFavorite: handleToggleFavorite,
        onProfileClick: () => router.push(`/profile/${post.userId}`),
      })),
    [
      displayName,
      handleReactToPost,
      handleRemoveReaction,
      handleToggleFavorite,
      locationLabel,
      posts,
      profile?.avatarUrl,
      router,
      user?.id,
    ]
  );

  const handleLoadMore = useCallback(() => {
    if (postsLoading || !postsHasMore) return;
    setPostsLoading(true);
    getUserPosts(userId, { page: postsPage + 1, size: PAGE_SIZE })
      .then((response) => {
        setPosts((prev) => [...prev, ...(response.content ?? [])]);
        setPostsPage(response.number ?? postsPage + 1);
        setPostsHasMore(!response.last);
      })
      .catch((error) => {
        setPostsError(resolveErrorMessage(error, "Unable to load posts"));
      })
      .finally(() => setPostsLoading(false));
  }, [postsHasMore, postsLoading, postsPage, userId]);

  if (profileLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading profile...")}</p>
        </Card>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title={t("Profile unavailable")}
          description={t(profileError)}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            {t("Go back")}
          </Button>
          <Button onClick={() => router.push("/matches")}>
            {t("Discover matches")}
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <EmptyState
          title={t("Profile unavailable")}
          description={t("This user hasn't completed their profile yet.")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <ProfileSummaryCard
        name={displayName}
        username={profile.username ?? undefined}
        location={locationLabel}
        jobTitle={profile.jobTitle ?? undefined}
        companyName={profile.companyName ?? undefined}
        bio={hasExtendedContent ? undefined : profile.bio ?? undefined}
        avatarUrl={profile.avatarUrl ?? undefined}
        matchScore={resolvedMatchScore}
      />

      {hasExtendedContent ? (
        <section className="grid gap-6 lg:grid-cols-2">
          {filledExtendedSections.length > 0 ? (
            <Card className="space-y-4 p-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-subtle">
                  {t("Personal profile")}
                </p>
                <h3 className="text-base font-semibold text-foreground">
                  {t("Who this person is")}
                </h3>
              </div>
              <div className="space-y-4">
                {filledExtendedSections.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <p className="text-xs font-medium text-subtle">{item.label}</p>
                    <p className="text-sm text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {filledPersonalSections.length > 0 ? (
            <Card className="space-y-4 p-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-subtle">
                  {t("Personal information")}
                </p>
                <h3 className="text-base font-semibold text-foreground">
                  {t("Optional details")}
                </h3>
              </div>
              <div className="space-y-3">
                {filledPersonalSections.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <p className="text-xs font-medium text-subtle">{item.label}</p>
                    <p className="text-sm text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </section>
      ) : null}

      {!hasExtendedContent && fallbackBio ? (
        <Card className="space-y-2 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            {t("Bio")}
          </p>
          <p className="text-sm text-foreground">{fallbackBio}</p>
        </Card>
      ) : null}

      <TestCountCard
        title={t("Insights completed")}
        count={testsCount}
        loading={testsCountLoading}
        description={
          testsCountLoading
            ? t("Fetching completed insights.")
            : t("This profile has completed {count} insights.", {
                count: testsCount ?? 0,
              })
        }
        variant="compact"
      />

      <ZyraProfileRecap
        userId={profile.userId}
        title={t("Zyra recap for {name}", { name: displayName })}
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t("Latest posts")}</h2>
            <p className="text-sm text-muted">
              {t("Recent updates shared by the user.")}
            </p>
          </div>
          {postsLoading ? <Loader size="sm" /> : null}
        </div>

        {postsError ? (
          <ErrorState
            title={t("Unable to load posts")}
            description={t(postsError)}
          />
        ) : posts.length === 0 && !postsLoading ? (
          <EmptyState
            title={t("No recent posts")}
            description={t("This profile hasn't published any content yet.")}
          />
        ) : null}

        {posts.length > 0 ? <MapPostCard items={postItems} /> : null}

        {postsHasMore ? (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="md"
              onClick={handleLoadMore}
              loading={postsLoading}
              loadingText={t("Loading")}
            >
              {t("Load more")}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
};
