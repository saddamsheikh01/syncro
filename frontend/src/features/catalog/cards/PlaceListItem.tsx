"use client";

import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { Badge } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";

export interface PlaceListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  title: string;
  subtitle?: string;
  address?: string;
  category?: string;
  metaItems?: string[];
  distanceKm?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  matchScore?: number;
  media?: ReactNode;
  href?: string;
  onPress?: () => void;
}

const PlaceholderIcon = () => (
  <svg className="h-10 w-10 text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const StarIcon = () => (
  <svg className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const PlaceListItem = ({
  className,
  title,
  subtitle,
  address,
  category,
  metaItems = [],
  distanceKm,
  imageUrl,
  rating,
  reviewCount,
  matchScore,
  media,
  href,
  onPress,
  ...props
}: PlaceListItemProps) => {
  const resolvedScore =
    typeof matchScore === "number"
      ? Math.round(matchScore)
      : typeof rating === "number"
        ? Math.min(98, Math.round(rating * 20))
        : undefined;

  const card = (
    <div
      className={cx(
        "group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-border-strong hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="relative h-36 w-full overflow-hidden bg-surface-muted">
        {media ?? (imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PlaceholderIcon />
          </div>
        ))}

        {typeof resolvedScore === "number" ? (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
            {resolvedScore}%
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 p-3">
        <h4 className="line-clamp-1 text-sm font-semibold text-foreground">
          {title}
        </h4>
        {subtitle || address ? (
          <p className="line-clamp-2 text-xs text-muted">
            {subtitle ?? address}
          </p>
        ) : null}

        {rating != null ? (
          <div className="flex items-center gap-1 text-xs font-medium text-foreground">
            <StarIcon />
            <span>{rating.toFixed(1)}</span>
            {reviewCount != null && reviewCount > 0 ? (
              <span className="text-muted">({reviewCount})</span>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          {category ? (
            <Badge tone="neutral" className="w-fit bg-surface-muted text-muted">
              {category}
            </Badge>
          ) : null}
          <div className="flex items-center justify-between gap-2 text-[11px] text-subtle">
            {typeof distanceKm === "number" ? (
              <span>
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)}m`
                  : `${distanceKm.toFixed(1)}km`}
              </span>
            ) : (
              <span className="text-subtle">View details</span>
            )}
            <span className="text-accent">View details</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block snap-start">
        {card}
      </Link>
    );
  }

  if (onPress) {
    return (
      <button type="button" onClick={onPress} className="w-full snap-start text-left">
        {card}
      </button>
    );
  }

  return <div className="snap-start">{card}</div>;
};
