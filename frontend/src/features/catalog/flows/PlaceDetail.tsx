"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Tag } from "@/components/elements/Tag";
import { StarRating } from "@/components/elements/StarRating";
import { PriceLevel } from "@/components/elements/PriceLevel";
import { OpeningHours } from "@/components/elements/OpeningHours";
import { PhotoGallery } from "@/components/elements/PhotoGallery";
import { AffiliationLinkBox } from "@/features/catalog/sections/AffiliationLinkBox";
import { ZyraPlaceRecap } from "@/features/zyra/cards/ZyraPlaceRecap";
import { useCatalog, useFavorites, usePosition, useT } from "@/hooks";
import { isUuid } from "@/lib/validators";
import { calculateDistanceKm, formatDistanceKm } from "@/lib/geo";

export interface PlaceDetailProps {
  placeId: string;
}

const formatGoogleType = (value: string) =>
  value
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const PlaceDetail = ({ placeId }: PlaceDetailProps) => {
  const router = useRouter();
  const { t } = useT();
  const { placeDetail, loading, error, actions } = useCatalog();
  const { items: favorites, actions: favoritesActions } = useFavorites();
  const { position, hasPosition } = usePosition();
  const bootstrappedRef = useRef(false);
  const favoritesBootstrappedRef = useRef(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const isValidId = isUuid(placeId);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const distanceKm = useMemo(() => {
    const currentPosition = position;
    const currentPlace = placeDetail;
    if (
      !hasPosition ||
      !currentPosition ||
      !currentPlace ||
      currentPosition.latitude === null ||
      currentPosition.longitude === null ||
      currentPlace.latitude === null ||
      currentPlace.longitude === null
    ) {
      return null;
    }
    return calculateDistanceKm(
      currentPosition.latitude,
      currentPosition.longitude,
      currentPlace.latitude,
      currentPlace.longitude
    );
  }, [hasPosition, position, placeDetail]);

  const isFavorite = useMemo(
    () => favorites.some((fav) => fav.place?.id === placeId),
    [favorites, placeId]
  );

  const googleTypeLabel = useMemo(() => {
    const value = placeDetail?.googleTypes?.[0];
    return value ? formatGoogleType(value) : null;
  }, [placeDetail?.googleTypes]);

  const googleMapsUrl = useMemo(() => {
    if (!placeDetail) return null;
    const base = "https://www.google.com/maps";
    if (placeDetail.googlePlaceId) {
      return `${base}/search/?api=1&query=${encodeURIComponent(placeDetail.name)}&query_place_id=${placeDetail.googlePlaceId}`;
    }
    if (placeDetail.latitude != null && placeDetail.longitude != null) {
      return `${base}?q=${placeDetail.latitude},${placeDetail.longitude}`;
    }
    if (placeDetail.address) {
      return `${base}/search/?api=1&query=${encodeURIComponent(placeDetail.address)}`;
    }
    return null;
  }, [placeDetail]);

  const googleDirectionsUrl = useMemo(() => {
    if (!placeDetail) return null;
    const base = "https://www.google.com/maps/dir/?api=1";
    if (placeDetail.googlePlaceId) {
      return `${base}&destination=${encodeURIComponent(placeDetail.name)}&destination_place_id=${placeDetail.googlePlaceId}`;
    }
    if (placeDetail.latitude != null && placeDetail.longitude != null) {
      return `${base}&destination=${placeDetail.latitude},${placeDetail.longitude}`;
    }
    if (placeDetail.address) {
      return `${base}&destination=${encodeURIComponent(placeDetail.address)}`;
    }
    return null;
  }, [placeDetail]);

  const handleOpenExternal = useCallback((url: string | null) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleCopy = useCallback(async (value: string, message: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyFeedback(message);
    } catch {
      setCopyFeedback(t("Unable to copy"));
    } finally {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopyFeedback(null);
      }, 2200);
    }
  }, []);

  const handleToggleFavorite = useCallback(async () => {
    if (savingFavorite) return;
    setSavingFavorite(true);
    try {
      if (isFavorite) {
        await favoritesActions.removeFavorite({ placeId });
      } else {
        await favoritesActions.addFavorite({ placeId });
      }
    } catch {
      // Error handled by store
    } finally {
      setSavingFavorite(false);
    }
  }, [placeId, isFavorite, savingFavorite, favoritesActions]);

  useEffect(() => {
    if (!isValidId) {
      actions.clearDetails();
      return;
    }
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    actions.fetchPlace(placeId).catch(() => undefined);
    return () => actions.clearDetails();
  }, [actions, placeId, isValidId]);

  useEffect(() => {
    if (favoritesBootstrappedRef.current) return;
    favoritesBootstrappedRef.current = true;
    favoritesActions.fetchFavorites({ type: "PLACE" }).catch(() => undefined);
  }, [favoritesActions]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  if (!isValidId) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title={t("Invalid place")}
          description={t(
            "The requested place does not exist or is unavailable."
          )}
          actionLabel={t("Back to places")}
          actionHref="/places"
        />
      </div>
    );
  }

  const isInitialLoading = loading && !placeDetail;

  if (isInitialLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading place...")}</p>
        </Card>
      </div>
    );
  }

  if (error && !placeDetail) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title={t("Unable to load place")}
          description={error.message}
          actionLabel={t("Back to places")}
          actionHref="/places"
        />
      </div>
    );
  }

  if (!placeDetail) {
    return null;
  }

  const affiliationLink = placeDetail.affiliationLinks?.[0];
  const hasCoordinates =
    placeDetail.latitude !== null && placeDetail.longitude !== null;
  const hasAddress = Boolean(placeDetail.address);
  const showPositionCard = hasCoordinates || hasAddress;
  const openNow = placeDetail.openingHours?.openNow;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start text-sm text-muted hover:text-foreground"
      >
        &larr; {t("Back")}
      </button>

      <Card className="space-y-4 p-5">
        {/* Galleria foto */}
        <PhotoGallery
          photos={placeDetail.photos?.length ? placeDetail.photos : (placeDetail.imageUrl ? [placeDetail.imageUrl] : [])}
          alt={placeDetail.name}
        />

        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {placeDetail.name}
              </h1>
              {/* Indirizzo */}
              {placeDetail.address && (
                <p className="text-sm text-muted">{placeDetail.address}</p>
              )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {placeDetail.category && (
                  <Badge tone="accent">{placeDetail.category.name}</Badge>
                )}
                {openNow !== undefined && (
                  <Badge tone={openNow ? "success" : "danger"} size="sm">
                    {openNow ? t("Open now") : t("Closed now")}
                  </Badge>
                )}
                {googleTypeLabel && (
                  <Badge tone="neutral" size="sm">
                    {googleTypeLabel}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Rating e prezzo */}
          <div className="flex flex-wrap items-center gap-4">
            {placeDetail.googleRating !== null && placeDetail.googleRating !== undefined && (
              <StarRating
                rating={placeDetail.googleRating}
                reviewCount={placeDetail.googleReviewCount ?? undefined}
              />
            )}
            {placeDetail.priceLevel !== null && placeDetail.priceLevel !== undefined && (
              <PriceLevel level={placeDetail.priceLevel} showLabel />
            )}
          </div>
        </div>

        {placeDetail.description && (
          <p className="text-sm text-muted">{placeDetail.description}</p>
        )}

        {placeDetail.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {placeDetail.tags.map((tag) => (
              <Tag key={tag.id} tone="neutral">
                {tag.name}
              </Tag>
            ))}
          </div>
        )}

        <ZyraPlaceRecap placeId={placeDetail.id} placeName={placeDetail.name} />

        {/* Orari di apertura */}
        {placeDetail.openingHours && (
          <OpeningHours data={placeDetail.openingHours} />
        )}

        {/* Contatti */}
        {(placeDetail.phone || placeDetail.website) && (
          <div className="space-y-2 border-t border-border pt-4">
            {placeDetail.phone && (
              <a
                href={`tel:${placeDetail.phone}`}
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {placeDetail.phone}
              </a>
            )}
            {placeDetail.website && (
              <a
                href={placeDetail.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                {t("Website")}
              </a>
            )}
          </div>
        )}

        {affiliationLink && (
          <AffiliationLinkBox
            title={t("Book this place")}
            href={affiliationLink.url}
            provider={affiliationLink.provider ?? undefined}
          />
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {googleMapsUrl && (
            <Button
              onClick={() => handleOpenExternal(googleMapsUrl)}
            >
              {t("Open in Google Maps")}
            </Button>
          )}
          {googleDirectionsUrl && (
            <Button
              variant="secondary"
              onClick={() => handleOpenExternal(googleDirectionsUrl)}
            >
              {t("Directions")}
            </Button>
          )}
          <Button
            variant={isFavorite ? "outline" : "secondary"}
            onClick={handleToggleFavorite}
            loading={savingFavorite}
            loadingText={isFavorite ? t("Removing...") : t("Saving...")}
          >
            {isFavorite ? t("Remove from favorites") : t("Save to favorites")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: placeDetail.name,
                  url: window.location.href,
                });
              }
            }}
          >
            {t("Share")}
          </Button>
        </div>
      </Card>

      {showPositionCard && (
        <Card className="space-y-3 p-5">
          <h3 className="text-base font-semibold text-foreground">
            {t("Location")}
          </h3>
          {distanceKm !== null && hasCoordinates && (
            <p className="text-sm font-medium text-accent">
              {t("About {distance} away", { distance: formatDistanceKm(distanceKm) })}
            </p>
          )}
          {hasAddress && (
            <p className="text-sm text-muted">{placeDetail.address}</p>
          )}
          {hasCoordinates && (
            <p className="text-sm text-muted">
              {t("Coordinates: {lat}, {lng}", {
                lat: placeDetail.latitude?.toFixed(6) ?? "",
                lng: placeDetail.longitude?.toFixed(6) ?? "",
              })}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {hasAddress && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleCopy(placeDetail.address ?? "", t("Address copied"))
                }
              >
                {t("Copy address")}
              </Button>
            )}
            {hasCoordinates && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleCopy(
                    `${placeDetail.latitude?.toFixed(6)}, ${placeDetail.longitude?.toFixed(6)}`,
                    t("Coordinates copied")
                  )
                }
              >
                {t("Copy coordinates")}
              </Button>
            )}
          </div>
          {copyFeedback && (
            <p className="text-xs text-success">{copyFeedback}</p>
          )}
        </Card>
      )}
    </div>
  );
};
