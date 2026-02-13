"use client";

import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { Badge } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";

export interface ExperienceListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  title: string;
  subtitle?: string;
  category?: string;
  metaItems?: string[];
  priceLabel?: string;
  originalPriceLabel?: string;
  rating?: number;
  reviewCount?: number;
  durationLabel?: string;
  imageUrl?: string;
  provider?: string;
  distanceKm?: number;
  media?: ReactNode;
  href?: string;
  onPress?: () => void;
}

const StarIcon = () => (
  <svg className="h-3.5 w-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const ExperienceListItem = ({
  className,
  title,
  subtitle,
  category,
  priceLabel,
  originalPriceLabel,
  rating,
  reviewCount,
  durationLabel,
  imageUrl,
  provider,
  distanceKm,
  media,
  href,
  onPress,
  ...props
}: ExperienceListItemProps) => {
  const isViator = provider?.toUpperCase() === "VIATOR";

  const card = (
    <div
      className={cx(
        "group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-card shadow-sm transition-all duration-300 hover:shadow-md",
        isViator
          ? "border-[#00a3c8]/35 bg-[radial-gradient(140%_100%_at_100%_0%,rgba(0,163,200,0.14)_0%,rgba(255,255,255,0)_62%)] hover:border-[#00a3c8]/65"
          : "border-border/70 hover:border-border-strong",
        className
      )}
      {...props}
    >
      {/* Image hero */}
      <div className="relative h-36 w-full overflow-hidden bg-surface-muted">
        {media ?? (imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        ))}

        {/* Category badge overlay */}
        {category && (
          <div className="absolute left-3 top-3">
            <Badge tone="neutral" className="bg-white/90 backdrop-blur-sm">
              {category}
            </Badge>
          </div>
        )}

        {isViator && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#00a3c8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
              Viator
            </span>
          </div>
        )}

        {/* Price badge overlay */}
        {priceLabel && (
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1.5 rounded-full bg-foreground/90 px-2.5 py-1 backdrop-blur-sm">
              {originalPriceLabel && (
                <span className="text-xs text-white/60 line-through">
                  {originalPriceLabel}
                </span>
              )}
              <span className="text-sm font-semibold text-white">
                {priceLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {isViator && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0085a6]">
            Viator Experience
          </p>
        )}
        <div className="space-y-1">
          <h4 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-accent">
            {title}
          </h4>
          {subtitle && (
            <p className="flex items-center gap-1 text-xs text-muted">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="truncate">{subtitle}</span>
            </p>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {rating != null && (
            <span className="flex items-center gap-1 text-xs font-medium text-foreground">
              <StarIcon />
              {rating.toFixed(1)}
              {reviewCount != null && reviewCount > 0 && (
                <span className="text-muted">({reviewCount})</span>
              )}
            </span>
          )}
          {durationLabel && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <ClockIcon />
              {durationLabel}
            </span>
          )}
          {distanceKm != null && (
            <span className="text-xs text-muted">
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
            </span>
          )}
          {provider && (
            <span
              className={cx(
                "ml-auto text-[10px] font-medium uppercase tracking-wide",
                isViator
                  ? "rounded-full bg-[#00a3c8]/12 px-2 py-0.5 text-[#007c9a]"
                  : "text-subtle"
              )}
            >
              {provider}
            </span>
          )}
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
