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
  media,
  href,
  onPress,
  ...props
}: ExperienceListItemProps) => {
  const card = (
    <Card className={cx("flex items-start gap-4 p-4", className)} {...props}>
      <div className="h-16 w-16 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted">
        {media ?? <div className="h-full w-full" />}
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
          {metaItems.length ? <PlaceMetaRow items={metaItems} /> : null}
          {priceLabel ? (
            <span className="text-xs font-semibold text-foreground">
              {priceLabel}
            </span>
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
