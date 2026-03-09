"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/buttons/Button";
import { useCatalog, usePosition, useT } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
import { getExperienceDetailPath } from "@/lib/siteUrl";
import { cx } from "@/lib/classNames";

const MapPinIcon = () => (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const formatDistance = (km: number) => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

const resolveCompatibility = (rating?: number | null) => {
  if (typeof rating === "number") return Math.min(98, Math.max(70, Math.round(rating * 20)));
  return 85;
};

export const NearbyHighlight = () => {
  const { t } = useT();
  const { position, hasPosition } = usePosition();
  const { places, experiences, loading, actions } = useCatalog();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    actions
      .fetchPlaces({
        size: 1,
        lat: hasPosition ? position?.latitude ?? undefined : undefined,
        lng: hasPosition ? position?.longitude ?? undefined : undefined,
      })
      .catch(() => undefined);

    actions.fetchExperiences({ size: 1 }).catch(() => undefined);
  }, [actions, hasPosition, position?.latitude, position?.longitude]);

  const place = places[0];
  const experience = experiences[0];

  if (loading && !place && !experience) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border/70 bg-card p-4 shadow-sm">
        <div className="mb-3 h-3 w-40 animate-pulse rounded bg-surface-muted" />
        <div className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
      </div>
    );
  }

  if (!place && !experience) return null;

  const placeDistance =
    place && position?.latitude != null && position?.longitude != null && place.latitude != null && place.longitude != null
      ? calculateDistanceKm(position.latitude, position.longitude, place.latitude, place.longitude)
      : undefined;

  return (
    <div className="rounded-[var(--radius-xl)] border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">
          {t("Matches update as you move, act, and interact.")}
        </p>
        <Link
          href="/map"
          className="text-[10px] font-medium text-accent hover:underline"
        >
          {t("Open map")}
        </Link>
      </div>

      <div className="space-y-3">
        {place ? (
          <div className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/40 p-3">
            <div className="flex gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted">
                {place.imageUrl ? (
                  <img
                    src={place.imageUrl}
                    alt={place.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-subtle">
                    <MapPinIcon />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {t("The place most aligned with you today")}
                </p>
                <p className="truncate text-xs text-muted">{place.name}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-subtle">
                  <span>
                    {t("Compatibility: {value}%", {
                      value: resolveCompatibility(place.googleRating),
                    })}
                  </span>
                  {placeDistance != null ? <span>{formatDistance(placeDistance)}</span> : null}
                </div>
              </div>
            </div>
            <Link href={`/places/${place.id}`} className="mt-2 block">
              <Button variant="secondary" size="sm" fullWidth>
                {t("View place")}
              </Button>
            </Link>
          </div>
        ) : null}

        {experience ? (
          <div className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/40 p-3">
            <div className="flex gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted">
                {experience.imageUrl ? (
                  <img
                    src={experience.imageUrl}
                    alt={experience.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-subtle">
                    <MapPinIcon />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {t("Experience happening now")}
                </p>
                <p className="truncate text-xs text-muted">{experience.name}</p>
                <div className="mt-1 text-[11px] text-subtle">
                  {t("Show interest")}
                </div>
              </div>
            </div>
            <Link href={getExperienceDetailPath(experience)} className="mt-2 block">
              <Button variant="secondary" size="sm" fullWidth>
                {t("Show interest")}
              </Button>
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
};
