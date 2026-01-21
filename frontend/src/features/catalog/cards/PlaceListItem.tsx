"use client";

import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { Badge } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";

export interface PlaceListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  title: string;
  subtitle?: string;
  category?: string;
  metaItems?: string[];
  distanceKm?: number;
  imageUrl?: string;
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

export const PlaceListItem = ({
  className,
  title,
  subtitle,
  category,
  metaItems = [],
  distanceKm,
  imageUrl,
  media,
  href,
  onPress,
  ...props
}: PlaceListItemProps) => {
  const card = (
    <div
      className={cx(
        "group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:border-border-strong",
        className
      )}
      {...props}
    >
      {/* Image */}
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

        {/* Category badge overlay */}
        {category && (
          <div className="absolute left-3 top-3">
            <Badge tone="neutral" className="bg-white/90 backdrop-blur-sm">
              {category}
            </Badge>
          </div>
        )}

        {/* Distance badge overlay */}
        {typeof distanceKm === "number" && (
          <div className="absolute bottom-3 right-3">
            <div className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
              {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="space-y-1">
          <h4 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-accent">
            {title}
          </h4>
          {subtitle && (
            <p className="line-clamp-2 text-xs text-muted">{subtitle}</p>
          )}
        </div>

        {/* Meta row */}
        {metaItems.length > 0 && (
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
            {metaItems.map((item, i) => (
              <span
                key={i}
                className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-muted"
              >
                {item}
              </span>
            ))}
          </div>
        )}
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
