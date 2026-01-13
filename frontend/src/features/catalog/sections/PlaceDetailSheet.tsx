import type { HTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Tag } from "@/components/elements/Tag";
import { DistanceBadge } from "@/features/catalog/elements/DistanceBadge";
import { PlaceMetaRow } from "@/features/catalog/elements/PlaceMetaRow";
import { cx } from "@/lib/classNames";

export interface PlaceDetailSheetProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  category?: string;
  distanceKm?: number;
  ratingLabel?: string;
  address?: string;
  description?: string;
  metaItems?: string[];
  tags?: string[];
  media?: ReactNode;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
}

export const PlaceDetailSheet = ({
  className,
  title,
  subtitle,
  category,
  distanceKm,
  ratingLabel,
  address,
  description,
  metaItems = [],
  tags = [],
  media,
  primaryActionLabel = "Prenota",
  secondaryActionLabel = "Salva",
  ...props
}: PlaceDetailSheetProps) => (
  <Card className={cx("space-y-4 p-5", className)} {...props}>
    <div className="overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted">
      {media ?? <div className="h-40 w-full" />}
    </div>
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
        </div>
        {category ? <Badge tone="accent">{category}</Badge> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {typeof distanceKm === "number" ? (
          <DistanceBadge distanceKm={distanceKm} />
        ) : null}
        {ratingLabel ? (
          <span className="text-xs font-semibold text-foreground">
            {ratingLabel}
          </span>
        ) : null}
      </div>
    </div>
    {address ? <p className="text-xs text-subtle">{address}</p> : null}
    {description ? <p className="text-sm text-muted">{description}</p> : null}
    {metaItems.length ? <PlaceMetaRow items={metaItems} /> : null}
    {tags.length ? (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag key={tag} tone="neutral">
            {tag}
          </Tag>
        ))}
      </div>
    ) : null}
    <div className="flex flex-wrap gap-3">
      <Button size="sm">{primaryActionLabel}</Button>
      <Button size="sm" variant="secondary">
        {secondaryActionLabel}
      </Button>
    </div>
  </Card>
);
