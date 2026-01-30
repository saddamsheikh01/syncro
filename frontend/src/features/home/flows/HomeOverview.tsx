"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import {
  QuickActionTile,
  type QuickActionVariant,
} from "@/features/home/cards/QuickActionTile";
import { RecommendationRow } from "@/features/home/sections/RecommendationRow";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { ForYouSectionHeader } from "@/features/home/sections/ForYouSectionHeader";
import { LocationRequestModal } from "@/features/home/sections/LocationRequestModal";
import { ZyraMatchOfDayCard } from "@/features/zyra/cards/ZyraMatchOfDayCard";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { PlaceListItem } from "@/features/catalog/cards/PlaceListItem";
import { MatchListItem } from "@/features/matches/elements/MatchListItem";
import { NavIcon } from "@/components/ui/NavIcon";
import { calculateDistanceKm } from "@/lib/geo";
import {
  useAuth,
  useUser,
  usePosition,
  useCatalog,
  useMatches,
  useZyra,
  useTutorial,
} from "@/hooks";
import { TutorialModal } from "@/features/tutorial/components/TutorialModal";

const RECO_PAGE_SIZE = 8;
const MATCH_LIMIT = 5;
const LOCATION_MODAL_DISMISSED_KEY = "syncro_location_modal_dismissed";
const TUTORIAL_DELAY_MS = 800;
const DISTANCE_EPSILON = 0.000001;

const QUICK_ACTIONS: Array<{
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  variant: QuickActionVariant;
  iconWrapperClassName?: string;
}> = [
  {
    title: "Mappa",
    subtitle: "Luoghi vicini",
    href: "/map",
    icon: <NavIcon name="map" className="h-5 w-5" />,
    variant: "map",
  },
  {
    title: "Match",
    subtitle: "Affinita",
    href: "/matches",
    icon: <NavIcon name="spark" className="h-5 w-5" />,
    variant: "match",
  },
  {
    title: "Luoghi",
    subtitle: "Scopri ora",
    href: "/places",
    icon: <NavIcon name="map-pin" className="h-5 w-5" />,
    variant: "places",
  },
  {
    title: "Feed",
    subtitle: "Post vicini",
    href: "/feed",
    icon: <NavIcon name="chat" className="h-5 w-5" />,
    variant: "feed",
  },
  {
    title: "Zyra",
    subtitle: "Suggerimenti",
    href: "/zyra",
    icon: <ZyraMark size="sm" />,
    variant: "zyra",
  },
  {
    title: "Chat",
    subtitle: "Conversazioni",
    href: "/chat",
    icon: <NavIcon name="chat" className="h-5 w-5" />,
    variant: "chat",
  },
  {
    title: "Tests",
    subtitle: "Nuovi quiz",
    href: "/tests",
    icon: <NavIcon name="clipboard" className="h-5 w-5" />,
    variant: "tests",
  },
];

export const HomeOverview = () => {
  const router = useRouter();
  const { status, actions: authActions } = useAuth();
  const { actions: userActions } = useUser();
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
    suggestions,
    loadingSuggestions,
    error: zyraError,
    actions: zyraActions,
  } = useZyra();
  const {
    currentStep: tutorialStep,
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

    userActions.fetchProfile().catch(() => undefined);
    userActions.fetchPreferences().catch(() => undefined);
    positionActions.fetchPosition().catch(() => undefined);

    matchesActions
      .fetchUserMatches({ size: MATCH_LIMIT })
      .catch(() => undefined);
    matchesActions
      .fetchRecommendations({ size: RECO_PAGE_SIZE })
      .catch(() => undefined);

    catalogActions.fetchPlaces({ size: RECO_PAGE_SIZE, source: "GOOGLE" }).catch(() => undefined);

    zyraActions.fetchSuggestions({ size: 10 }).catch(() => undefined);
  }, [
    status,
    userActions,
    positionActions,
    matchesActions,
    catalogActions,
    zyraActions,
  ]);

  useEffect(() => {
    if (
      !hasPosition ||
      position?.latitude == null ||
      position?.longitude == null
    ) {
      locationFetchRef.current = null;
      return;
    }
    const key = `${position.latitude}:${position.longitude}`;
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
  }, [catalogActions, hasPosition, position?.latitude, position?.longitude]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (tutorialTriggeredRef.current) return;
    if (tutorialCompleted || tutorialSkipped) return;

    tutorialTriggeredRef.current = true;

    const timer = setTimeout(() => {
      tutorialActions.open();
    }, TUTORIAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [status, tutorialCompleted, tutorialSkipped, tutorialActions]);

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

  const recommendationPlaces = useMemo(
    () =>
      recommendations
        .filter((rec) => rec.type === "PLACE" && rec.place)
        .map((rec) => rec.place!),
    [recommendations],
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

  const matchSpotlight = userMatches.length ? userMatches[0] : null;
  const otherMatches =
    userMatches.length > 1 ? userMatches.slice(1, MATCH_LIMIT) : [];

  const isPlacesLoading = hasPosition
    ? catalogLoading && places.length === 0
    : catalogLoading && places.length === 0 && recommendationPlaces.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Per te
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          Cosa vuoi fare oggi?
        </h1>
        <p className="text-sm text-muted">
          Scopri suggerimenti personalizzati, match e luoghi vicini. Tutto
          basato sul tuo profilo Syncro.
        </p>
      </header>

      <section className="space-y-4">
        <SectionHeader
          title="Accesso rapido"
          subtitle="Raggiungi subito le sezioni principali."
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionTile key={action.title} {...action} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <ForYouSectionHeader
          title="Luoghi per te"
          subtitle="Vicini e in linea con le tue passioni."
          actionLabel="Vedi tutti"
          actionHref="/places"
        />

        {isPlacesLoading ? (
          <Card className="flex items-center gap-3 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">Caricamento luoghi...</p>
          </Card>
        ) : catalogError ? (
          <ErrorState
            title="Impossibile caricare i luoghi"
            description={catalogError.message}
          />
        ) : placeCards.length === 0 ? (
          <EmptyState
            title="Nessun luogo disponibile"
            description="Salva la posizione o esplora il catalogo."
          />
        ) : (
          <RecommendationRow
            title="Per te"
            subtitle="Luoghi suggeriti"
            actionLabel="Apri mappa"
            actionHref="/map"
          >
            {placeCards.map((item, index) => (
              <PlaceListItem
                key={`${item.title}-${index}`}
                className="min-w-[260px]"
                {...item}
              />
            ))}
          </RecommendationRow>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Match del giorno"
          subtitle="Persone affini basate sulle tue passioni e test completati."
          actionLabel="Vai ai match"
          actionHref="/matches"
        />

        {loadingUserMatches && !matchSpotlight ? (
          <Card className="flex items-center gap-3 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">Caricamento match...</p>
          </Card>
        ) : matchesError ? (
          <ErrorState
            title="Impossibile caricare i match"
            description={matchesError.message}
          />
        ) : !matchSpotlight ? (
          <EmptyState
            title="Nessun match disponibile"
            description="Completa onboarding, passioni e test per generare i match."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
            <ZyraMatchOfDayCard
              title={
                matchSpotlight.user?.fullName ??
                `Utente ${matchSpotlight.userId.slice(0, 6)}`
              }
              subtitle={matchSpotlight.user?.city ?? undefined}
              description={
                matchSpotlight.explanation ??
                "Affinita calcolata sulle passioni condivise."
              }
              matchScore={matchSpotlight.scoreTotal ?? undefined}
              profileHref={`/profile/${matchSpotlight.userId}`}
              actionHref={`/chat`}
              actionLabel="Scrivi"
            />

            <div className="space-y-3">
              {otherMatches.length > 0 ? (
                otherMatches.map((match) => (
                  <MatchListItem
                    key={match.matchId}
                    match={match}
                    onProfileClick={() => router.push(`/profile/${match.userId}`)}
                  />
                ))
              ) : (
                <Card className="p-4 text-sm text-muted">
                  Nessun altro match disponibile al momento.
                </Card>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Suggerimenti Zyra"
          subtitle="Ultimi consigli generati dal tuo profilo."
          actionLabel="Apri chat"
          actionHref="/zyra"
        />
      </section>

      <LocationRequestModal
        open={showLocationModal}
        onClose={handleLocationModalClose}
        onActivate={handleLocationActivate}
        loading={locationModalLoading}
      />

      <TutorialModal
        open={tutorialOpen}
        currentStep={tutorialStep}
        onNext={tutorialActions.nextStep}
        onPrevious={tutorialActions.previousStep}
        onSkip={tutorialActions.skip}
        onClose={tutorialActions.close}
        onComplete={tutorialActions.complete}
        onStepClick={tutorialActions.goToStep}
      />
    </div>
  );
};
