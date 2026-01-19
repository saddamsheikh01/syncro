import type { HTMLAttributes, ReactNode } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Tag } from "@/components/elements/Tag";
import { DistanceBadge } from "@/features/catalog/elements/DistanceBadge";
import { PlaceMetaRow } from "@/features/catalog/elements/PlaceMetaRow";
import { cx } from "@/lib/classNames";

export interface MapPlacePreviewProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  category?: string;
  distanceKm?: number;
  ratingLabel?: string;
  metaItems?: string[];
  tags?: string[];
  media?: ReactNode;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onClose?: () => void;
}

export const MapPlacePreview = ({
  className,
  title,
  subtitle,
  category,
  distanceKm,
  ratingLabel,
  metaItems = [],
  tags = [],
  media,
  primaryActionLabel = "Apri",
  secondaryActionLabel = "Salva",
  onPrimaryAction,
  onSecondaryAction,
  onClose,
  ...props
}: MapPlacePreviewProps) => (
  <Card className={cx("relative space-y-4 p-4", className)} {...props}>
    {onClose ? (
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-muted transition hover:bg-border hover:text-foreground"
        aria-label="Chiudi"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    ) : null}
    <div className="flex flex-wrap gap-4">
      <div className="h-24 w-24 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted">
        {media ?? <div className="h-full w-full" />}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
          <div className="min-w-0 space-y-1">
            <h4 className="truncate text-base font-semibold text-foreground">
              {title}
            </h4>
            {subtitle ? (
              <p className="line-clamp-2 text-xs text-subtle">{subtitle}</p>
            ) : null}
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
        {metaItems.length ? <PlaceMetaRow items={metaItems} /> : null}
      </div>
    </div>
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
      <Button size="sm" onClick={onPrimaryAction}>
        {primaryActionLabel}
      </Button>
      <Button size="sm" variant="secondary" onClick={onSecondaryAction}>
        {secondaryActionLabel}
      </Button>
    </div>
  </Card>
);
