import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { PlaceMetaRow } from "@/features/catalog/elements/PlaceMetaRow";
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
  media?: ReactNode;
  href?: string;
  onPress?: () => void;
}

export const ExperienceListItem = ({
  className,
  title,
  subtitle,
  category,
  metaItems = [],
  priceLabel,
  originalPriceLabel,
  rating,
  reviewCount,
  durationLabel,
  imageUrl,
  provider,
  media,
  href,
  onPress,
  ...props
}: ExperienceListItemProps) => {
  const card = (
    <Card className={cx("flex items-start gap-4 p-4", className)} {...props}>
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted">
        {media ?? (imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full" />
        ))}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-foreground">{title}</h4>
            {subtitle ? (
              <p className="text-xs text-subtle">{subtitle}</p>
            ) : null}
          </div>
          {category ? <Badge tone="accent">{category}</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rating != null && (
            <span className="flex items-center gap-1 text-xs text-muted">
              <span className="text-yellow-500">★</span>
              {rating.toFixed(1)}
              {reviewCount != null && reviewCount > 0 && (
                <span className="text-subtle">({reviewCount})</span>
              )}
            </span>
          )}
          {durationLabel && (
            <span className="text-xs text-muted">{durationLabel}</span>
          )}
          {metaItems.length ? <PlaceMetaRow items={metaItems} /> : null}
          {priceLabel && (
            <span className="flex items-center gap-1">
              {originalPriceLabel && (
                <span className="text-xs text-subtle line-through">
                  {originalPriceLabel}
                </span>
              )}
              <span className="text-xs font-semibold text-foreground">
                {priceLabel}
              </span>
            </span>
          )}
          {provider && (
            <span className="text-[10px] text-subtle">{provider}</span>
          )}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  if (onPress) {
    return (
      <button type="button" onClick={onPress} className="w-full text-left">
        {card}
      </button>
    );
  }

  return card;
};
