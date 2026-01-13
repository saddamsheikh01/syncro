import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { DistanceBadge } from "@/features/catalog/elements/DistanceBadge";
import { cx } from "@/lib/classNames";

export type FavoriteType = "PLACE" | "EXPERIENCE";

export interface FavoriteItemCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  title: string;
  subtitle?: string;
  typeLabel?: FavoriteType;
  distanceKm?: number;
  media?: ReactNode;
  href?: string;
  onPress?: () => void;
}

const getTypeLabel = (typeLabel?: FavoriteType) => {
  if (typeLabel === "EXPERIENCE") return "Esperienza";
  if (typeLabel === "PLACE") return "Luogo";
  return undefined;
};

export const FavoriteItemCard = ({
  className,
  title,
  subtitle,
  typeLabel,
  distanceKm,
  media,
  href,
  onPress,
  ...props
}: FavoriteItemCardProps) => {
  const card = (
    <Card className={cx("space-y-3 p-4", className)} {...props}>
      <div className="overflow-hidden rounded-[var(--radius-md)]">
        {media ?? (
          <div className="h-28 w-full rounded-[var(--radius-md)] bg-surface-muted" />
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
          {getTypeLabel(typeLabel) ? (
            <Badge tone="accent">{getTypeLabel(typeLabel)}</Badge>
          ) : null}
        </div>
        {typeof distanceKm === "number" ? (
          <DistanceBadge distanceKm={distanceKm} />
        ) : null}
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
