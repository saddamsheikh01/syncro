"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCatalog, usePosition } from "@/hooks";
import { calculateDistanceKm } from "@/lib/geo";
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

export const NearbyHighlight = () => {
  const { position, hasPosition } = usePosition();
  const { experiences, places, loading, actions } = useCatalog();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current || !hasPosition) return;
    if (!position?.latitude || !position?.longitude) return;
    fetchedRef.current = true;

    actions
      .fetchExperiences({
        size: 1,
        lat: position.latitude,
        lng: position.longitude,
      })
      .catch(() => undefined);

    actions
      .fetchPlaces({
        size: 1,
        lat: position.latitude,
        lng: position.longitude,
      })
      .catch(() => undefined);
  }, [actions, hasPosition, position?.latitude, position?.longitude]);

  if (!hasPosition) return null;

  const experience = experiences[0];
  const place = places[0];

  // Calculate distances and pick closest
  let item: { type: "experience" | "place"; name: string; location?: string; distance?: number; href: string; imageUrl?: string } | null = null;

  if (experience && position?.latitude && position?.longitude) {
    const expLat = experience.place?.latitude;
    const expLng = experience.place?.longitude;
    const distance = expLat != null && expLng != null
      ? calculateDistanceKm(position.latitude, position.longitude, expLat, expLng)
      : undefined;

    item = {
      type: "experience",
      name: experience.name,
      location: experience.locationName ?? experience.place?.name ?? undefined,
      distance,
      href: `/experiences/${experience.id}`,
      imageUrl: experience.imageUrl ?? undefined,
    };
  }

  if (place && position?.latitude && position?.longitude) {
    const placeLat = place.latitude;
    const placeLng = place.longitude;
    const placeDistance = placeLat != null && placeLng != null
      ? calculateDistanceKm(position.latitude, position.longitude, placeLat, placeLng)
      : undefined;

    if (!item || (placeDistance != null && item.distance != null && placeDistance < item.distance)) {
      item = {
        type: "place",
        name: place.name,
        location: place.description ?? undefined,
        distance: placeDistance,
        href: `/places/${place.id}`,
      };
    }
  }

  if (loading && !item) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">Vicino a te</p>
        <div className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <MapPinIcon />
          <span>Vicino a te</span>
        </div>
        <Link
          href="/map"
          className="text-[10px] font-medium text-accent hover:underline"
        >
          Apri mappa
        </Link>
      </div>

      <Link
        href={item.href}
        className={cx(
          "group block overflow-hidden rounded-[var(--radius-lg)] border border-qa-places-border/50 transition-all duration-300",
          "hover:border-qa-places-border hover:shadow-[0_6px_20px_var(--qa-places-glow)]"
        )}
        style={{
          background: "linear-gradient(135deg, var(--qa-places-bg) 0%, transparent 60%)",
        }}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Image or icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-qa-places-bg">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <MapPinIcon />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-[var(--qa-places-gradient-start)]">
              {item.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted">
              {item.location && (
                <span className="truncate">{item.location}</span>
              )}
              {item.distance != null && (
                <span className="shrink-0 rounded-full bg-qa-places-bg px-1.5 py-0.5 text-[10px] font-medium text-[var(--qa-places-gradient-end)]">
                  {formatDistance(item.distance)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
