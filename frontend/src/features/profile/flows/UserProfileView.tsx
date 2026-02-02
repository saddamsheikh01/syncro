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
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { MatchBreakdownCard } from "@/features/matches/sections/MatchBreakdownCard";
import { ZyraProfileRecap } from "@/features/zyra/cards/ZyraProfileRecap";
import { TestCountCard } from "@/components/ui/TestCountCard";
import { useAnalytics, useAuth, useChat } from "@/hooks";
import { getMatchWithUser } from "@/services/matches";
import { getUserTestsCount } from "@/services/tests";
import { getUserPosts, getUserProfile } from "@/services/users";
import { likePost, unlikePost } from "@/services/social";
import type { UserPublicProfileResponse } from "@/types/profile";
import type { PostResponse } from "@/types/social";
import type { UserMatchResponse, MatchBreakdown, DimensionScores, DomainScores } from "@/types/matches";

const PAGE_SIZE = 6;

const parseBreakdown = (raw: Record<string, unknown> | null): MatchBreakdown | null => {
  if (!raw) return null;
  return {
    dimensions: raw.dimensions as DimensionScores | undefined,
    domains: raw.domains as DomainScores | undefined,
    sharedTags: raw.sharedTags as string[] | number | undefined,
    distanceKm: raw.distanceKm as number | undefined,
  };
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  SINGLE: "Single",
  IN_RELATIONSHIP: "In relazione",
  MARRIED: "Sposato/a",
  SEPARATED: "Separato/a",
  COMPLICATED: "Situazione complicata",
  OTHER: "Altro",
};

const ORIENTATION_LABELS: Record<string, string> = {
  HETERO: "Etero",
  GAY: "Gay",
  BI: "Bisessuale",
  ASEXUAL: "Asessuale",
  OTHER: "Altro",
};

const CHILDREN_LABELS: Record<string, string> = {
  NO_CHILDREN: "Nessun figlio",
  HAS_CHILDREN: "Ha figli",
  WANTS_CHILDREN: "Vuole figli",
  DOES_NOT_WANT: "Non vuole figli",
  UNDECIDED: "Indeciso/a",
};

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

const formatLocation = (profile: UserPublicProfileResponse | null) => {
  if (!profile) return undefined;
  const parts = [profile.city, profile.country].filter(Boolean);
  const location = parts.length ? parts.join(", ") : "";
  const ageLabel = profile.age ? `${profile.age} anni` : "";
  return [location, ageLabel].filter(Boolean).join(" · ") || undefined;
};

const resolveLabel = (value: string | null | undefined, map: Record<string, string>) =>
  value ? map[value] ?? value : null;

export interface UserProfileViewProps {
  userId: string;
}

export const UserProfileView = ({ userId }: UserProfileViewProps) => {
  const router = useRouter();
  const { status, user, actions: authActions } = useAuth();
  const { actions: chatActions, loadingConversations } = useChat();
  const { actions: analyticsActions } = useAnalytics();

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
  const [startingChat, setStartingChat] = useState(false);
  const analyticsTrackedRef = useRef(false);

  useEffect(() => {
    authActions.hydrate();
    authActions.fetchMe().catch(() => undefined);
  }, [authActions]);

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
          .catch((error) => {
            if (!active) return;
            setMatchError(resolveErrorMessage(error, "Match non disponibile."));
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
            setPostsError(resolveErrorMessage(error, "Impossibile caricare i post."));
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
          resolveErrorMessage(error, "Profilo non disponibile.")
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
    if (!profile) return "Profilo";
    return (
      profile.fullName?.trim() ||
      profile.username ||
      `Utente ${profile.userId.slice(0, 6)}`
    );
  }, [profile]);

  const locationLabel = useMemo(() => formatLocation(profile), [profile]);
  const extendedSections = useMemo(
    () => [
      { label: "Cosa mi caratterizza", value: profile?.traitsText ?? null },
      { label: "Cosa amo", value: profile?.lovesText ?? null },
      { label: "Cosa non sopporto", value: profile?.dislikesText ?? null },
      { label: "Cosa cerco", value: profile?.goalsText ?? null },
      { label: "Valori", value: profile?.valuesText ?? null },
    ],
    [profile]
  );
  const personalSections = useMemo(
    () => [
      {
        label: "Stato relazionale",
        value: resolveLabel(profile?.relationshipStatus, RELATIONSHIP_LABELS),
      },
      {
        label: "Orientamento",
        value: resolveLabel(profile?.orientation, ORIENTATION_LABELS),
      },
      {
        label: "Figli",
        value: resolveLabel(profile?.childrenStatus, CHILDREN_LABELS),
      },
    ],
    [profile]
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

  const postItems = useMemo(
    () =>
      posts.map((post) => ({
        post,
        authorName: displayName,
        authorSubtitle: locationLabel,
        avatarUrl: profile?.avatarUrl ?? undefined,
        currentUserId: user?.id,
        onLike: async (postId: string) => {
          try {
            await likePost(postId);
            setPosts((prev) =>
              prev.map((item) =>
                item.id === postId
                  ? {
                      ...item,
                      likedByMe: true,
                      likeCount: item.likeCount + 1,
                    }
                  : item
              )
            );
          } catch {
            // Gestito a livello UI base
          }
        },
        onUnlike: async (postId: string) => {
          try {
            await unlikePost(postId);
            setPosts((prev) =>
              prev.map((item) =>
                item.id === postId
                  ? {
                      ...item,
                      likedByMe: false,
                      likeCount: Math.max(0, item.likeCount - 1),
                    }
                  : item
              )
            );
          } catch {
            // Gestito a livello UI base
          }
        },
        onProfileClick: () => router.push(`/profile/${post.userId}`),
      })),
    [displayName, locationLabel, posts, profile?.avatarUrl, router, user?.id]
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
        setPostsError(resolveErrorMessage(error, "Impossibile caricare i post."));
      })
      .finally(() => setPostsLoading(false));
  }, [postsHasMore, postsLoading, postsPage, userId]);

  const handleStartChat = useCallback(async () => {
    if (!profile?.userId) return;
    setStartingChat(true);
    try {
      const conversation = await chatActions.createConversation({
        otherUserId: profile.userId,
      });
      router.push(`/chat/${conversation.id}`);
    } catch {
      // Gestito dallo store
    } finally {
      setStartingChat(false);
    }
  }, [chatActions, profile?.userId, router]);

  if (profileLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Caricamento profilo...</p>
        </Card>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title="Profilo non disponibile"
          description={profileError}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => router.back()}>
            Torna indietro
          </Button>
          <Button onClick={() => router.push("/matches")}>
            Scopri match
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <EmptyState
          title="Profilo non disponibile"
          description="L'utente non ha ancora completato il profilo."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Profilo pubblico
        </p>
        <p className="text-sm text-muted">
          Scopri il profilo, i match e i contenuti recenti.
        </p>
      </header>

      <ProfileSummaryCard
        name={displayName}
        username={profile.username ?? undefined}
        location={locationLabel}
        jobTitle={profile.jobTitle ?? undefined}
        companyName={profile.companyName ?? undefined}
        bio={hasExtendedContent ? undefined : profile.bio ?? undefined}
        avatarUrl={profile.avatarUrl ?? undefined}
        matchScore={match?.scoreTotal ?? undefined}
      />

      {hasExtendedContent ? (
        <section className="grid gap-6 lg:grid-cols-2">
          {filledExtendedSections.length > 0 ? (
            <Card className="space-y-4 p-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-subtle">
                  Profilo personale
                </p>
                <h3 className="text-base font-semibold text-foreground">
                  Chi e questa persona
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
                  Informazioni personali
                </p>
                <h3 className="text-base font-semibold text-foreground">
                  Dettagli opzionali
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
            Bio
          </p>
          <p className="text-sm text-foreground">{fallbackBio}</p>
        </Card>
      ) : null}

      <TestCountCard
        title="Test completati"
        count={testsCount}
        loading={testsCountLoading}
        description={
          testsCountLoading
            ? "Sto recuperando i test completati."
            : `Questo profilo ha completato ${testsCount ?? 0} test.`
        }
        variant="compact"
      />

      <ZyraProfileRecap
        userId={profile.userId}
        title={`Recap Zyra su ${displayName}`}
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
                Match con te
              </p>
              <h3 className="text-base font-semibold text-foreground">
                Compatibilita attuale
              </h3>
            </div>
            {match?.scoreTotal != null ? (
              <MatchScoreBadge score={match.scoreTotal} />
            ) : null}
          </div>
          {matchLoading ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <Loader size="sm" />
              Calcolo match in corso...
            </div>
          ) : matchError ? (
            <p className="text-sm text-muted">{matchError}</p>
          ) : match ? (
            <>
              {match.explanation ? (
                <p className="text-sm text-muted">{match.explanation}</p>
              ) : null}
              <MatchBreakdownCard
                breakdown={parseBreakdown(match.breakdown as Record<string, unknown> | null)}
              />
            </>
          ) : (
            <p className="text-sm text-muted">
              Match non disponibile al momento.
            </p>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Azioni rapide
          </p>
          <Button
            size="sm"
            onClick={handleStartChat}
            loading={startingChat || loadingConversations}
            loadingText="Apertura"
            disabled={status !== "authenticated"}
          >
            Inizia chat
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push("/matches")}
          >
            Torna ai match
          </Button>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Ultimi post</h2>
            <p className="text-sm text-muted">
              Aggiornamenti recenti condivisi dall&apos;utente.
            </p>
          </div>
          {postsLoading ? <Loader size="sm" /> : null}
        </div>

        {postsError ? (
          <ErrorState
            title="Impossibile caricare i post"
            description={postsError}
          />
        ) : posts.length === 0 && !postsLoading ? (
          <EmptyState
            title="Nessun post recente"
            description="Questo profilo non ha ancora pubblicato contenuti."
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
              loadingText="Caricamento"
            >
              Carica altri
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
};
