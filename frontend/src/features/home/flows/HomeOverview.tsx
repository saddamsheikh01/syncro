"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { Avatar } from "@/components/elements/Avatar";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { LocationRequestModal } from "@/features/home/sections/LocationRequestModal";
import { OnboardingProgressCard } from "@/features/onboarding/cards/OnboardingProgressCard";
import { PlaceListItem } from "@/features/catalog/cards/PlaceListItem";
import { ViatorExperiencesSection } from "@/features/catalog/sections/ViatorExperiencesSection";
import { MatchCard } from "@/features/matches/cards/MatchCard";
import { ConnectButton } from "@/features/matches/elements/ConnectButton";
import { MatchTypeChip } from "@/features/matches/elements/MatchTypeChip";
import { MapTestListItem } from "@/features/insights/lists/MapTestListItem";
import { calculateDistanceKm } from "@/lib/geo";
import { INSIGHT_COPY_KEYS, resolveTestCopy } from "@/lib/insightsCopy";
import { getDomainFilterItems, getMatchDomainMeta } from "@/lib/matchDomains";
import type { DomainFilter } from "@/lib/matchDomains";
import type { UserMatchResponse } from "@/types/matches";
import {
  useAuth,
  useUser,
  usePosition,
  useCatalog,
  useMatches,
  useTutorial,
  useTests,
  useChat,
  useT,
} from "@/hooks";
import { recordDashboardVisit } from "@/services/users";
import { TutorialModal } from "@/features/tutorial/components/TutorialModal";

const RECO_PAGE_SIZE = 8;
const LOCATION_MODAL_DISMISSED_KEY = "syncro_location_modal_dismissed";
const DISTANCE_EPSILON = 0.000001;

export const HomeOverview = () => {
  const router = useRouter();
  const { t, locale } = useT();
  const { status, user, actions: authActions } = useAuth();
  const { profile, actions: userActions } = useUser();
  const {
    position,
    hasPosition,
    actions: positionActions,
  } = usePosition();
  const {
    places,
    loading: catalogLoading,
    error: catalogError,
    actions: catalogActions,
  } = useCatalog();
  const {
    userMatches,
    loadingUserMatches,
    recommendations,
    error: matchesError,
    actions: matchesActions,
  } = useMatches();
  const {
    tests,
    loading: testsLoading,
    error: testsError,
    actions: testsActions,
  } = useTests();
  const {
    conversations,
    loadingConversations,
    actions: chatActions,
  } = useChat();
  const {
    isOpen: tutorialOpen,
    completed: tutorialCompleted,
    skipped: tutorialSkipped,
    actions: tutorialActions,
  } = useTutorial();

  const bootstrappedRef = useRef(false);
  const tutorialTriggeredRef = useRef(false);
  const locationFetchRef = useRef<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalLoading, setLocationModalLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainFilter>("ALL");

  useEffect(() => {
    authActions.hydrate();
    positionActions.hydrate();
    userActions.hydrateLanguage?.();
    tutorialActions.hydrate();
  }, [authActions, positionActions, userActions, tutorialActions]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    recordDashboardVisit().catch(() => undefined);
    userActions.fetchProfile().catch(() => undefined);
    userActions.fetchPreferences().catch(() => undefined);
    positionActions.fetchPosition().catch(() => undefined);

    matchesActions
      .fetchRecommendations({ size: RECO_PAGE_SIZE })
      .catch(() => undefined);

    catalogActions.fetchPlaces({ size: RECO_PAGE_SIZE, source: "GOOGLE" }).catch(() => undefined);

    testsActions.fetchTests().catch(() => undefined);
    chatActions.fetchConversations({ page: 0, size: 3 }).catch(() => undefined);
  }, [
    status,
    userActions,
    positionActions,
    matchesActions,
    catalogActions,
    testsActions,
    chatActions,
  ]);

  useEffect(() => {
    if (status !== "authenticated") return;
    matchesActions
      .fetchUserMatches({
        size: 5,
        domain: selectedDomain === "ALL" ? undefined : selectedDomain,
      })
      .catch(() => undefined);
  }, [matchesActions, selectedDomain, status]);

  useEffect(() => {
    if (
      !hasPosition ||
      position?.latitude == null ||
      position?.longitude == null
    ) {
      locationFetchRef.current = null;
      return;
    }
    const key = `${position.latitude}:${position.longitude}:${locale}`;
    if (locationFetchRef.current === key) return;
    locationFetchRef.current = key;

    catalogActions
      .fetchPlaces({
        size: RECO_PAGE_SIZE,
        lat: position.latitude,
        lng: position.longitude,
        source: "GOOGLE",
      })
      .catch(() => undefined);
  }, [catalogActions, hasPosition, locale, position?.latitude, position?.longitude]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (tutorialTriggeredRef.current) return;
    if (tutorialCompleted || tutorialSkipped || user?.onboardingCompleted) return;

    tutorialTriggeredRef.current = true;
    tutorialActions.open();
  }, [
    status,
    tutorialCompleted,
    tutorialSkipped,
    tutorialActions,
    user?.onboardingCompleted,
  ]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (hasPosition) return;
    if (tutorialOpen) return;

    const dismissed = localStorage.getItem(LOCATION_MODAL_DISMISSED_KEY);
    if (dismissed === "true") return;

    const timer = setTimeout(() => {
      setShowLocationModal(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [status, hasPosition, tutorialOpen]);

  const handleLocationModalClose = () => {
    localStorage.setItem(LOCATION_MODAL_DISMISSED_KEY, "true");
    setShowLocationModal(false);
  };

  const handleLocationActivate = () => {
    if (!navigator?.geolocation) {
      handleLocationModalClose();
      return;
    }

    setLocationModalLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          positionActions.setPermission("granted");
          await positionActions.savePosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
          });
          setShowLocationModal(false);
        } catch {
          handleLocationModalClose();
        } finally {
          setLocationModalLoading(false);
        }
      },
      () => {
        positionActions.setPermission("denied");
        setLocationModalLoading(false);
        handleLocationModalClose();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleCompleteOnboardingIntro = () => {
    tutorialActions.complete();
    router.push("/profile");
  };

  const recommendationPlaces = useMemo(
    () =>
      recommendations
        .filter((rec) => rec.type === "PLACE" && rec.place)
        .map((rec) => rec.place!),
    [recommendations],
  );
  const homeMatchDomainFilterItems = useMemo(
    () => getDomainFilterItems(t),
    [t],
  );
  const matchScoreLabel = useMemo(
    () =>
      selectedDomain === "ALL"
        ? "Overall"
        : getMatchDomainMeta(selectedDomain).label,
    [selectedDomain]
  );

  const placeCards = useMemo(() => {
    const list =
      hasPosition && places.length > 0
        ? places
        : recommendationPlaces.length
          ? recommendationPlaces
          : places;
    const items = list.map((place) => {
      let distanceKm: number | undefined;
      if (
        hasPosition &&
        position?.latitude != null &&
        position?.longitude != null &&
        place.latitude != null &&
        place.longitude != null
      ) {
        distanceKm = calculateDistanceKm(
          position.latitude,
          position.longitude,
          place.latitude,
          place.longitude,
        );
      }

      return {
        title: place.name,
        subtitle: place.description ?? undefined,
        address: place.address ?? undefined,
        category: place.category?.name ?? undefined,
        metaItems: place.source ? [place.source] : [],
        distanceKm,
        imageUrl: place.imageUrl ?? undefined,
        rating: place.googleRating ?? undefined,
        reviewCount: place.googleReviewCount ?? undefined,
        href: `/places/${place.id}`,
      };
    });

    if (hasPosition) {
      return [...items].sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        if (Math.abs(a.distanceKm - b.distanceKm) < DISTANCE_EPSILON) {
          return 0;
        }
        return a.distanceKm - b.distanceKm;
      });
    }

    return items;
  }, [recommendationPlaces, places, hasPosition, position]);

  const astrologyCompleted = profile?.hasBirthChart === true;

  const testItems = useMemo(
    () => {
      const fromApi = tests.slice(0, 5).map((test) => {
        const copyKeys =
          test.testType != null ? INSIGHT_COPY_KEYS[test.testType] : null;
        const title = copyKeys
          ? t(copyKeys.titleKey)
          : resolveTestCopy({
              title: test.title,
              description: test.description,
              testType: test.testType,
            }).title;
        const description = copyKeys?.descriptionKey
          ? t(copyKeys.descriptionKey)
          : resolveTestCopy({
              title: test.title,
              description: test.description,
              testType: test.testType,
            }).description;
        return {
          testType: test.testType,
          title,
          description,
          href: `/insights/${test.id}`,
          actionLabel: t("View Insights"),
          completed: test.completed,
        };
      });
      const birthChartItem = {
        testType: "ASTRO" as const,
        title: t("Birth chart"),
        description: t("Used for compatibility. Add place and optional time for better accuracy."),
        href: "/insights/astrology",
        actionLabel: t("View Insights"),
        completed: astrologyCompleted,
      };
      return [...fromApi, birthChartItem];
    },
    [tests, t, astrologyCompleted]
  );

  const conversationItems = useMemo(() => {
    const matchMap = new Map<string, UserMatchResponse>();
    userMatches.forEach((match) => {
      if (match.userId) {
        matchMap.set(match.userId, match);
      }
    });

    return conversations.slice(0, 3).map((conversation) => {
      const otherParticipant = conversation.participants?.find(
        (participant) => participant.userId !== user?.id
      );
      const name = otherParticipant?.fullName || t("User");
      const avatarUrl = otherParticipant?.avatarUrl ?? undefined;
      const message =
        conversation.lastMessage?.content ?? t("No messages yet.");
      const match = otherParticipant?.userId
        ? matchMap.get(otherParticipant.userId)
        : undefined;
      const score =
        match?.scoreTotal != null ? Math.round(match.scoreTotal) : null;
      const unreadCount = (conversation as { unreadCount?: number }).unreadCount;
      return {
        id: conversation.id,
        name,
        avatarUrl,
        message,
        score,
        unreadCount,
      };
    });
  }, [conversations, t, user?.id, userMatches]);

  const isPlacesLoading = hasPosition
    ? catalogLoading && places.length === 0
    : catalogLoading && places.length === 0 && recommendationPlaces.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <OnboardingProgressCard />

      <section className="space-y-4">
        <SectionHeader
          title={t("People & Connections")}
          subtitle={t("Connections relevant to your current moment.")}
          actionLabel={t("View Connections")}
          actionHref="/matches"
        />

        <div className="flex flex-wrap gap-2">
          {homeMatchDomainFilterItems.map((domain) => (
            <MatchTypeChip
              key={domain.id}
              label={domain.label}
              selected={selectedDomain === domain.id}
              onToggleState={(nextSelected) => {
                if (!nextSelected) return;
                setSelectedDomain(domain.id);
              }}
            />
          ))}
        </div>

        {loadingUserMatches && userMatches.length === 0 ? (
          <Card className="flex items-center gap-3 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading matches...")}</p>
          </Card>
        ) : matchesError ? (
          <ErrorState
            title={t("Unable to load matches")}
            description={matchesError.message}
          />
        ) : userMatches.length === 0 ? (
          <EmptyState
            title={t("No matches available")}
            description={t(
              "Complete onboarding, interests, and insights to generate matches."
            )}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {userMatches.slice(0, 4).map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                href={`/profile/${match.userId}`}
                scoreLabel={matchScoreLabel}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title={t("Places")}
          subtitle={t("Places from Google Maps that make sense for you right now.")}
          actionLabel={t("Explore More")}
          actionHref="/places"
        />

        <div className="flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-foreground">{t("Fine-Tune")}</span>
          <span>{t("Nearby")}</span>
          <span className="text-subtle">{t("Anywhere")}</span>
          <span>{t("Distance")}</span>
          <span className="text-subtle">{t("10 Km")}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            "Experiences",
            "Events",
            "Stays",
            "Restaurants",
            "Places",
            "Services",
          ].map((label) => (
            <span
              key={label}
              className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
            >
              {t(label)}
            </span>
          ))}
        </div>

        {isPlacesLoading ? (
          <Card className="flex items-center gap-3 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading places...")}</p>
          </Card>
        ) : catalogError ? (
          <ErrorState
            title={t("Unable to load places")}
            description={catalogError.message}
          />
        ) : placeCards.length === 0 ? (
          <EmptyState
            title={t("No places available")}
            description={t("Save your location or explore the catalog.")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {placeCards.slice(0, 4).map((item, index) => (
              <PlaceListItem
                key={`${item.title}-${index}`}
                {...item}
              />
            ))}
          </div>
        )}
      </section>

      <ViatorExperiencesSection
        title="Experiences"
        subtitle="Curated Viator activities, separated from local places."
        actionLabel="View all"
        actionHref="/places#viator-experiences"
        pageSize={4}
        maxItems={4}
        showLoadMore={false}
      />

      <section className="space-y-4">
        <SectionHeader
          title={t("Moments")}
          subtitle={t(
            "Relevant people and places, aligned with your current moment."
          )}
          actionLabel={t("Go To Moments")}
          actionHref="/moments"
        />

        <div className="flex items-center gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <span
              key={index}
              className="h-7 w-7 rounded-full border border-border/70 bg-white"
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {t("People & Connections")}
              </p>
              <div className="flex gap-2">
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground">
                  {t("Fine-Tune")}
                </span>
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground">
                  {t("Contexts")}
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {userMatches.slice(0, 2).map((match) => (
                <div key={match.matchId} className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={match.user?.fullName ?? t("User")}
                      src={match.user?.avatarUrl ?? undefined}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {match.user?.fullName ?? t("User")}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {match.user?.city ?? t("Location")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-subtle">
                    <span>
                      {t("{score}% Match", {
                        score: Math.round(match.scoreTotal ?? 0),
                      })}
                    </span>
                    <ConnectButton
                      userId={match.userId}
                      profileHref={`/profile/${match.userId}`}
                      className="!py-1 !text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {t("Places & Experiences")}
              </p>
              <div className="flex gap-2">
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground">
                  {t("Fine-Tune")}
                </span>
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-foreground">
                  {t("Contexts")}
                </span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {placeCards.slice(0, 2).map((place, index) => (
                <div key={`${place.title}-${index}`} className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/50 p-3">
                  <p className="text-xs font-semibold text-foreground">{place.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted">
                    {place.subtitle ?? place.address}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-subtle">
                    <span>{place.category ?? t("Places")}</span>
                    <Link href={place.href ?? "/places"} className="text-accent">
                      {t("Connect")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-[var(--radius-xl)] border border-border/60 bg-[#f7f1f7] p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                {t("Conversations")}
              </h3>
              {conversationItems.length > 0 ? (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#f14b4b] px-1 text-[10px] font-semibold text-white">
                  {conversationItems.length}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted">
              {t("Keep the conversation going with people you're aligned with.")}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {loadingConversations && conversationItems.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-white/70 bg-white/80 px-3 py-2"
                  >
                    <div className="h-10 w-10 animate-pulse rounded-full bg-surface-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
                      <div className="h-2 w-full animate-pulse rounded bg-surface-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversationItems.length === 0 ? (
              <p className="text-sm text-muted">
                {t("No conversations available.")}
              </p>
            ) : (
              conversationItems.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/chat/${conversation.id}`}
                  className="group flex items-center gap-3 rounded-[var(--radius-lg)] border border-white/70 bg-white/90 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative">
                    <Avatar
                      name={conversation.name}
                      src={conversation.avatarUrl}
                      size="sm"
                    />
                    {conversation.unreadCount && conversation.unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f14b4b] px-1 text-[9px] font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {conversation.name}
                      </p>
                      {conversation.score != null ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-1.5 py-0.5 shadow-sm">
                          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
                            {conversation.score}%
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <p className="line-clamp-2 text-[11px] text-muted">
                      {conversation.message}
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-white text-accent shadow-sm transition group-hover:translate-x-0.5">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="mt-5 flex justify-center">
            <Link
              href="/chat"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_var(--accent-glow)] transition hover:brightness-95"
            >
              {t("Open Conversations")}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title={t("Insights")}
          subtitle={t("Insights that help improve accuracy and alignment.")}
          actionLabel={t("Explore Insights")}
          actionHref="/profile#insights"
        />

        <Card className="space-y-4 bg-surface-muted/60 p-5">
          {testsLoading && tests.length === 0 ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <Loader size="sm" />
              {t("Loading insights...")}
            </div>
          ) : testsError ? (
            <ErrorState
              title={t("Unable to load insights")}
              description={testsError.message}
            />
          ) : tests.length === 0 ? (
            <EmptyState
              title={t("No insights available")}
              description={t("Check back later for new insights.")}
            />
          ) : (
            <>
              <MapTestListItem items={testItems} />
              <div className="flex justify-center">
                <Link href="/profile#insights">
                  <Button size="sm">{t("Explore Insights")}</Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </section>

      <LocationRequestModal
        open={showLocationModal}
        onClose={handleLocationModalClose}
        onActivate={handleLocationActivate}
        loading={locationModalLoading}
      />

      <TutorialModal
        open={tutorialOpen}
        onSkip={tutorialActions.skip}
        onClose={tutorialActions.close}
        onComplete={handleCompleteOnboardingIntro}
      />
    </div>
  );
};
