"use client";

import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { Badge } from "@/components/elements/Badge";
import { useT } from "@/hooks";
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
  const { t } = useT();
  const isViatorProvider = provider?.trim().toUpperCase() === "VIATOR";
  const trimmedSubtitle = subtitle?.trim();
  const isLikelyDestinationRef = Boolean(
    trimmedSubtitle &&
      !trimmedSubtitle.includes(" ") &&
      /[0-9]/.test(trimmedSubtitle) &&
      /^[A-Za-z0-9_-]+$/.test(trimmedSubtitle)
  );
  const visibleSubtitle = isViatorProvider ? undefined : subtitle;
  const locationBadgeLabel = isViatorProvider
    ? trimmedSubtitle && !isLikelyDestinationRef
      ? trimmedSubtitle
      : null
    : null;
  const showProvider = Boolean(provider) && !isViatorProvider;

  const card = (
    <div
      className={cx(
        "group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-border-strong hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="relative h-36 w-full shrink-0 overflow-hidden bg-surface-muted">
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

        {priceLabel && (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
            <div className="flex items-center gap-1">
              {originalPriceLabel && (
                <span className="text-subtle line-through">
                  {originalPriceLabel}
                </span>
              )}
              <span>{priceLabel}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <h4 className="line-clamp-2 text-sm font-semibold text-foreground">
          {title}
        </h4>
        {visibleSubtitle ? (
          <p className="line-clamp-2 text-xs text-muted">{visibleSubtitle}</p>
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
          <div className="flex flex-wrap items-center gap-2">
            {category ? (
              <Badge tone="neutral" className="w-fit bg-surface-muted text-muted">
                {category}
              </Badge>
            ) : null}
            {locationBadgeLabel ? (
              <Badge tone="neutral" className="w-fit bg-accent-soft text-accent">
                {locationBadgeLabel}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-subtle">
            {durationLabel ? (
              <span className="flex items-center gap-1">
                <ClockIcon />
                {durationLabel}
              </span>
            ) : distanceKm != null ? (
              <span>
                {distanceKm < 1
                  ? `${Math.round(distanceKm * 1000)}m`
                  : `${distanceKm.toFixed(1)}km`}
              </span>
            ) : (
              <span className="text-subtle">{t("View details")}</span>
            )}
            <span className="text-accent">{t("View details")}</span>
          </div>
          {showProvider ? (
            <div className="text-[11px] text-subtle">
              {t("Provider")}: {provider}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full snap-start">
        {card}
      </Link>
    );
  }

  if (onPress) {
    return (
      <button type="button" onClick={onPress} className="flex h-full w-full snap-start flex-col text-left">
        {card}
      </button>
    );
  }

  return <div className="flex h-full snap-start flex-col">{card}</div>;
};
