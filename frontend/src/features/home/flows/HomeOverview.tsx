"use client";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { QuickActionTile } from "@/features/home/cards/QuickActionTile";
import { RecommendationRow } from "@/features/home/sections/RecommendationRow";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { ForYouSectionHeader } from "@/features/home/sections/ForYouSectionHeader";
import { ZyraMatchOfDayCard } from "@/features/zyra/cards/ZyraMatchOfDayCard";
import { MapPermissionScreen } from "@/features/map/sections/MapPermissionScreen";
import { PlaceListItem } from "@/features/catalog/cards/PlaceListItem";
import { ExperienceListItem } from "@/features/catalog/cards/ExperienceListItem";
import { MatchListItem } from "@/features/matches/elements/MatchListItem";
import { ZyraSuggestionsFlow } from "@/features/zyra/flows/ZyraSuggestionsFlow";
import { NavIcon } from "@/components/ui/NavIcon";
import { calculateDistanceKm } from "@/lib/geo";
import { useAuth, useUser, usePosition, useCatalog, useMatches, useAnalytics, useZyra } from "@/hooks";

const RECO_PAGE_SIZE = 8;
const MATCH_LIMIT = 5;

const formatDuration = (minutes: number | null): string | undefined => {
  if (!minutes) return undefined;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

const formatPrice = (price: number | null, currency: string | null): string | undefined => {
  if (price == null) return undefined;
  const curr = currency ?? "EUR";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: curr }).format(price);
};

const QUICK_ACTIONS = [
  { title: "Mappa", subtitle: "Luoghi vicini", href: "/map", icon: <NavIcon name="map" className="h-5 w-5" /> },
  { title: "Match", subtitle: "Affinita", href: "/matches", icon: <NavIcon name="spark" className="h-5 w-5" /> },
  { title: "Esperienze", subtitle: "Per te", href: "/experiences", icon: <NavIcon name="spark" className="h-5 w-5" /> },
  { title: "Luoghi", subtitle: "Scopri ora", href: "/places", icon: <NavIcon name="map-pin" className="h-5 w-5" /> },
  { title: "Feed", subtitle: "Post vicini", href: "/feed", icon: <NavIcon name="chat" className="h-5 w-5" /> },
  { title: "Zyra", subtitle: "Suggerimenti", href: "/zyra", icon: <NavIcon name="spark" className="h-5 w-5" /> },
  { title: "Chat", subtitle: "Conversazioni", href: "/chat", icon: <NavIcon name="chat" className="h-5 w-5" /> },
  { title: "Tests", subtitle: "Nuovi quiz", href: "/tests", icon: <NavIcon name="clipboard" className="h-5 w-5" /> },
];

export const HomeOverview = () => {
  const { status, actions: authActions } = useAuth();
  const { actions: userActions } = useUser();
  const {
    position,
    hasPosition,
    permission,
    loading: positionLoading,
    actions: positionActions,
  } = usePosition();
  const {
    experiences,
    places,
    loading: catalogLoading,
    error: catalogError,
    actions: catalogActions,
  } = useCatalog();
  const {
    userMatches,
    loadingUserMatches,
    recommendations,
    loadingRecommendations,
    error: matchesError,
    actions: matchesActions,
  } = useMatches();
  const { suggestions, loadingSuggestions, error: zyraError, actions: zyraActions } = useZyra();
  const { actions: analyticsActions } = useAnalytics();

  const bootstrappedRef = useRef(false);

  useEffect(() => {
    authActions.hydrate();
    positionActions.hydrate();
    userActions.hydrateLanguage?.();
  }, [authActions, positionActions, userActions]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    userActions.fetchProfile().catch(() => undefined);
    userActions.fetchPreferences().catch(() => undefined);
    positionActions.fetchPosition().catch(() => undefined);

    matchesActions.fetchUserMatches({ size: MATCH_LIMIT }).catch(() => undefined);
    matchesActions.fetchRecommendations({ size: RECO_PAGE_SIZE }).catch(() => undefined);

    catalogActions.fetchExperiences({ size: RECO_PAGE_SIZE }).catch(() => undefined);
    catalogActions.fetchPlaces({ size: RECO_PAGE_SIZE }).catch(() => undefined);

    zyraActions.fetchSuggestions({ size: 10 }).catch(() => undefined);
    analyticsActions.trackEvent({ eventType: "APP_OPEN" }).catch(() => undefined);
  }, [status, userActions, positionActions, matchesActions, catalogActions, zyraActions, analyticsActions]);

  const recommendationExperiences = useMemo(
    () =>
      recommendations
        .filter((rec) => rec.type === "EXPERIENCE" && rec.experience)
        .map((rec) => rec.experience!),
    [recommendations]
  );

  const recommendationPlaces = useMemo(
    () => recommendations.filter((rec) => rec.type === "PLACE" && rec.place).map((rec) => rec.place!),
    [recommendations]
  );

  const experienceCards = useMemo(
    () =>
      (recommendationExperiences.length ? recommendationExperiences : experiences).map((exp) => ({
        title: exp.name,
        subtitle: exp.locationName ?? exp.place?.name ?? undefined,
        category: exp.category?.name ?? undefined,
        href: `/experiences/${exp.id}`,
        imageUrl: exp.imageUrl ?? undefined,
        priceLabel: formatPrice(exp.price, exp.priceCurrency),
        originalPriceLabel:
          exp.originalPrice && exp.price && exp.originalPrice > exp.price
            ? formatPrice(exp.originalPrice, exp.priceCurrency)
            : undefined,
        rating: exp.rating ?? undefined,
        reviewCount: exp.reviewCount ?? undefined,
        durationLabel: formatDuration(exp.durationMinutes),
        provider: exp.provider ?? undefined,
      })),
    [recommendationExperiences, experiences]
  );

  const placeCards = useMemo(() => {
    const list = recommendationPlaces.length ? recommendationPlaces : places;
    return list.map((place) => {
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
          place.longitude
        );
      }

      return {
        title: place.name,
        subtitle: place.description ?? undefined,
        category: place.category?.name ?? undefined,
        metaItems: place.source ? [place.source] : [],
        distanceKm,
        href: `/places/${place.id}`,
      };
    });
  }, [recommendationPlaces, places, hasPosition, position]);

  const matchSpotlight = userMatches.length ? userMatches[0] : null;
  const otherMatches = userMatches.length > 1 ? userMatches.slice(1, MATCH_LIMIT) : [];

  const isRecoLoading = loadingRecommendations && experiences.length === 0 && recommendationExperiences.length === 0;
  const isPlacesLoading = catalogLoading && places.length === 0 && recommendationPlaces.length === 0;

  const handleRequestPosition = () => {
    if (permission === "unknown") {
      positionActions.setPermission("unknown");
    }
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          positionActions.setPermission("granted");
          positionActions.setPosition({
            userId: "",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
            updatedAt: new Date().toISOString(),
          });
        },
        () => positionActions.setPermission("denied")
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">Per te</p>
        <h1 className="text-3xl font-semibold text-foreground">Cosa vuoi fare oggi?</h1>
        <p className="text-sm text-muted">
          Scopri suggerimenti personalizzati, match e luoghi vicini. Tutto basato sul tuo profilo Syncro.
        </p>
      </header>

      <section className="space-y-4">
        <SectionHeader title="Accesso rapido" subtitle="Raggiungi subito le sezioni principali." />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <QuickActionTile key={action.title} {...action} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <ForYouSectionHeader
          title="Esperienze consigliate"
          subtitle="Selezionate per te in base al profilo e alle preferenze."
          actionLabel="Vedi tutte"
          actionHref="/experiences"
        />

        {isRecoLoading ? (
          <Card className="flex items-center gap-3 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">Caricamento esperienze...</p>
          </Card>
        ) : matchesError ? (
          <ErrorState title="Impossibile caricare le esperienze" description={matchesError.message} />
        ) : experienceCards.length === 0 ? (
          <EmptyState title="Nessuna esperienza" description="Aggiungi interessi o completa i test per suggerimenti migliori." />
        ) : (
          <RecommendationRow title="Per te" subtitle="Attivita da provare subito." actionLabel="Apri mappa" actionHref="/map">
            {experienceCards.map((item, index) => (
              <ExperienceListItem key={`${item.title}-${index}`} className="min-w-[260px]" {...item} />
            ))}
          </RecommendationRow>
        )}
      </section>

      <section className="space-y-4">
        <ForYouSectionHeader
          title="Luoghi per te"
          subtitle="Vicini e in linea con i tuoi interessi."
          actionLabel="Vedi tutti"
          actionHref="/places"
        />

        {isPlacesLoading ? (
          <Card className="flex items-center gap-3 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">Caricamento luoghi...</p>
          </Card>
        ) : catalogError ? (
          <ErrorState title="Impossibile caricare i luoghi" description={catalogError.message} />
        ) : placeCards.length === 0 ? (
          <EmptyState title="Nessun luogo disponibile" description="Salva la posizione o esplora il catalogo." />
        ) : (
          <RecommendationRow title="Per te" subtitle="Luoghi suggeriti" actionLabel="Apri mappa" actionHref="/map">
            {placeCards.map((item, index) => (
              <PlaceListItem key={`${item.title}-${index}`} className="min-w-[260px]" {...item} />
            ))}
          </RecommendationRow>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Match del giorno"
          subtitle="Persone affini basate sui tuoi interessi e test completati."
          actionLabel="Vai ai match"
          actionHref="/matches"
        />

        {loadingUserMatches && !matchSpotlight ? (
          <Card className="flex items-center gap-3 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">Caricamento match...</p>
          </Card>
        ) : matchesError ? (
          <ErrorState title="Impossibile caricare i match" description={matchesError.message} />
        ) : !matchSpotlight ? (
          <EmptyState title="Nessun match disponibile" description="Completa onboarding, interessi e test per generare i match." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
            <ZyraMatchOfDayCard
              title={matchSpotlight.user?.fullName ?? `Utente ${matchSpotlight.userId.slice(0, 6)}`}
              subtitle={matchSpotlight.user?.city ?? undefined}
              description={matchSpotlight.explanation ?? "Affinita calcolata sugli interessi condivisi."}
              matchScore={matchSpotlight.scoreTotal ?? undefined}
              actionHref={`/chat`}
              actionLabel="Scrivi"
            />

            <div className="space-y-3">
              {otherMatches.length > 0 ? (
                otherMatches.map((match) => (
                  <MatchListItem key={match.matchId} match={match} />
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
          title="Vicino a te"
          subtitle="Attiva la posizione per vedere suggerimenti nel raggio selezionato."
          actionLabel="Apri mappa"
          actionHref="/map"
        />

        {permission !== "granted" ? (
          <MapPermissionScreen
            primaryActionLabel={positionLoading ? "Attivazione..." : "Attiva posizione"}
            secondaryActionLabel="Continua senza posizione"
            onPrimaryAction={handleRequestPosition}
            onSecondaryAction={() => positionActions.setPermission("granted")}
            helper="La posizione migliora raccomandazioni e distanze."
          />
        ) : placeCards.length === 0 ? (
          <EmptyState title="Nessun luogo vicino" description="Non ci sono risultati per quest'area." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {placeCards.slice(0, 4).map((item, index) => (
              <PlaceListItem key={`${item.title}-near-${index}`} {...item} />
            ))}
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

        {loadingSuggestions && suggestions.length === 0 ? (
          <Card className="flex items-center gap-3 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">Caricamento suggerimenti...</p>
          </Card>
        ) : zyraError && suggestions.length === 0 ? (
          <ErrorState title="Impossibile caricare Zyra" description={zyraError.message} />
        ) : (
          <ZyraSuggestionsFlow />
        )}
      </section>
    </div>
  );
};
