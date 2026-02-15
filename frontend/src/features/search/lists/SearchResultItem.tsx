"use client";

import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { DistanceBadge } from "@/features/catalog/elements/DistanceBadge";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export type SearchResultType = "USER" | "PLACE";

export interface SearchResultItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  type: SearchResultType;
  title: string;
  subtitle?: string;
  meta?: string;
  avatarUrl?: string;
  distanceKm?: number;
  matchScore?: number;
  href?: string;
  onPress?: () => void;
}

const getTypeLabel = (type: SearchResultType) => {
  if (type === "USER") return "User";
  return "Place";
};

export const SearchResultItem = ({
  className,
  type,
  title,
  subtitle,
  meta,
  avatarUrl,
  distanceKm,
  matchScore,
  href,
  onPress,
  ...props
}: SearchResultItemProps) => {
  const { t } = useT();
  const typeLabel = getTypeLabel(type);
  const card = (
    <Card
      className={cx(
        "flex flex-wrap items-start gap-4 p-4 sm:flex-nowrap sm:items-center",
        className
      )}
      {...props}
    >
      {type === "USER" ? (
        <Avatar name={title} src={avatarUrl} />
      ) : (
        <div className="h-12 w-12 rounded-[var(--radius-md)] bg-surface-muted" />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <Badge tone="neutral" size="sm">
            {t(typeLabel)}
          </Badge>
        </div>
        {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
        {meta ? <p className="text-xs text-muted">{meta}</p> : null}
      </div>
      <div className="flex flex-col items-end gap-2">
        {typeof matchScore === "number" ? (
          <MatchScoreBadge score={matchScore} showLabel={false} />
        ) : null}
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
