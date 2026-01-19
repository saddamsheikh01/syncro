import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { Avatar } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import type { UserMatchResponse } from "@/types/matches";
import { cx } from "@/lib/classNames";

export interface MatchListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick" | "onSelect"> {
  match: UserMatchResponse;
  selected?: boolean;
  onSelectMatch?: (matchId: string) => void;
}

const formatName = (userId: string) => {
  const suffix = userId.slice(0, 6);
  return `Utente ${suffix}`;
};

const getDisplayName = (match: UserMatchResponse) => {
  const fullName = match.user?.fullName?.trim();
  if (fullName) return fullName;
  return formatName(match.userId);
};

const formatLocation = (match: UserMatchResponse) => {
  const city = match.user?.city?.trim();
  const country = match.user?.country?.trim();
  const parts = [city, country].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};

const formatUpdatedAt = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 60) {
    return `Aggiornato ${diffMinutes} min fa`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `Aggiornato ${diffHours}h fa`;
  }
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
  });
};

export const MatchListItem = ({
  className,
  match,
  selected = false,
  onSelectMatch,
  ...props
}: MatchListItemProps) => {
  const name = getDisplayName(match);
  const score = match.scoreTotal ?? 0;
  const explanation = match.explanation ?? "Affinita calcolata sugli interessi condivisi.";
  const updatedLabel = formatUpdatedAt(match.updatedAt);
  const sharedTags = match.breakdown?.["sharedTags"];
  const location = formatLocation(match);

  return (
    <div {...props}>
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onSelectMatch?.(match.matchId)}
      >
        <Card
          className={cx(
            "flex flex-wrap items-start gap-4 p-4 sm:items-center",
            selected && "border-accent/40 shadow-md",
            className
          )}
        >
          <Avatar name={name} src={match.user?.avatarUrl ?? undefined} />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <Badge tone="neutral" size="sm">
                Match
              </Badge>
              {typeof sharedTags === "number" ? (
                <Badge tone="accent" size="sm">
                  {sharedTags} interessi comuni
                </Badge>
              ) : null}
            </div>
            {location ? <p className="text-xs text-subtle">{location}</p> : null}
            <p className="text-xs text-subtle">{explanation}</p>
            <p className="text-[11px] text-muted">{updatedLabel}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <MatchScoreBadge score={score} />
          </div>
        </Card>
      </button>
    </div>
  );
};
