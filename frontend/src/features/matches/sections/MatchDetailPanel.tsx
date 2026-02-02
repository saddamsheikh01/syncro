import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Avatar } from "@/components/elements/Avatar";
import { Tag } from "@/components/elements/Tag";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { MatchBreakdownCard } from "@/features/matches/sections/MatchBreakdownCard";
import type { MatchBreakdown } from "@/types/matches";
import { cx } from "@/lib/classNames";
import { formatInterestLabel } from "@/lib/interestEmoji";

export interface MatchDetailPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  name: string;
  location?: string;
  avatarUrl?: string;
  matchScore?: number;
  bio?: string;
  sharedPassions?: string[];
  breakdown?: MatchBreakdown | null;
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
  sharedPassions = [],
  breakdown,
  primaryActionLabel = "Vedi profilo",
  secondaryActionLabel = "Salva",
  onPrimaryAction,
  onSecondaryAction,
  primaryActionDisabled,
  secondaryActionDisabled,
  ...props
}: MatchDetailPanelProps) => (
  <div className={cx("space-y-4", className)} {...props}>
    {/* Header Card */}
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} src={avatarUrl} size="lg" />
          <div className="min-w-0 space-y-1">
            <p className="truncate text-lg font-semibold text-foreground">
              {name}
            </p>
            {location ? (
              <p className="flex items-center gap-1 text-sm text-muted">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {location}
              </p>
            ) : null}
          </div>
        </div>
        {typeof matchScore === "number" ? (
          <MatchScoreBadge score={matchScore} size="lg" />
        ) : null}
      </div>

      {/* Passioni condivise */}
      {sharedPassions.length > 0 && (
        <div className="mt-4 rounded-lg bg-surface-muted/50 p-3">
          <p className="mb-2 text-xs font-medium text-subtle">Passioni in comune</p>
          <div className="flex flex-wrap gap-2">
            {sharedPassions.slice(0, 6).map((passion) => (
              <Tag key={passion} tone="accent">
                {formatInterestLabel(passion)}
              </Tag>
            ))}
            {sharedPassions.length > 6 && (
              <span className="flex items-center text-xs text-muted">
                +{sharedPassions.length - 6} altre
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {(primaryActionLabel || secondaryActionLabel) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {primaryActionLabel && (
            <Button
              size="sm"
              onClick={onPrimaryAction}
              disabled={primaryActionDisabled}
              className="flex-1"
            >
              {primaryActionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onSecondaryAction}
              disabled={secondaryActionDisabled}
              className="flex-1"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </Card>

    {/* Breakdown Cards */}
    {breakdown && <MatchBreakdownCard breakdown={breakdown} />}
  </div>
);
