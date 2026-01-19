import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Avatar } from "@/components/elements/Avatar";
import { Tag } from "@/components/elements/Tag";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { MapMatchInsightItem } from "@/features/matches/lists/MapMatchInsightItem";
import type { MatchInsightItemProps } from "@/features/matches/elements/MatchInsightItem";
import { cx } from "@/lib/classNames";

export interface MatchDetailPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  name: string;
  location?: string;
  avatarUrl?: string;
  matchScore?: number;
  bio?: string;
  tags?: string[];
  insights?: MatchInsightItemProps[];
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryActionDisabled?: boolean;
  secondaryActionDisabled?: boolean;
}

export const MatchDetailPanel = ({
  className,
  name,
  location,
  avatarUrl,
  matchScore,
  bio,
  tags = [],
  insights = [],
  primaryActionLabel = "Vedi profilo",
  secondaryActionLabel = "Salva",
  onPrimaryAction,
  onSecondaryAction,
  primaryActionDisabled,
  secondaryActionDisabled,
  ...props
}: MatchDetailPanelProps) => (
  <Card className={cx("space-y-5 p-6", className)} {...props}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} src={avatarUrl} />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-base font-semibold text-foreground">
            {name}
          </p>
          {location ? <p className="text-xs text-subtle">{location}</p> : null}
        </div>
      </div>
      {typeof matchScore === "number" ? (
        <MatchScoreBadge score={matchScore} />
      ) : null}
    </div>
    {bio ? <p className="text-sm text-muted">{bio}</p> : null}
    {tags.length ? (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag key={tag} tone="neutral">
            {tag}
          </Tag>
        ))}
      </div>
    ) : null}
    {insights.length ? (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-subtle">Insight compatibilita</p>
        <MapMatchInsightItem items={insights} />
      </div>
    ) : null}
    {primaryActionLabel || secondaryActionLabel ? (
      <div className="flex flex-wrap gap-3">
        {primaryActionLabel ? (
          <Button size="sm" onClick={onPrimaryAction} disabled={primaryActionDisabled}>
            {primaryActionLabel}
          </Button>
        ) : null}
        {secondaryActionLabel ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={onSecondaryAction}
            disabled={secondaryActionDisabled}
          >
            {secondaryActionLabel}
          </Button>
        ) : null}
      </div>
    ) : null}
  </Card>
);
