import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { DistanceBadge } from "@/features/catalog/elements/DistanceBadge";
import { PlaceMetaRow } from "@/features/catalog/elements/PlaceMetaRow";
import { cx } from "@/lib/classNames";

export interface PlaceListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  title: string;
  subtitle?: string;
  category?: string;
  metaItems?: string[];
  distanceKm?: number;
  media?: ReactNode;
  href?: string;
  onPress?: () => void;
}

export const PlaceListItem = ({
  className,
  title,
  subtitle,
  category,
  metaItems = [],
  distanceKm,
  media,
  href,
  onPress,
  ...props
}: PlaceListItemProps) => {
  const card = (
    <Card className={cx("space-y-4 p-4", className)} {...props}>
      <div className="overflow-hidden rounded-[var(--radius-md)]">
        {media ?? (
          <div className="h-36 w-full rounded-[var(--radius-md)] bg-surface-muted" />
        )}
      </div>
      <div className="space-y-2">
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
          {metaItems.length ? <PlaceMetaRow items={metaItems} /> : null}
          {typeof distanceKm === "number" ? (
            <DistanceBadge distanceKm={distanceKm} />
          ) : null}
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
