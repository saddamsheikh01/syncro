"use client";

import type { HTMLAttributes, KeyboardEvent, MouseEvent } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Tag } from "@/components/elements/Tag";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { NavIcon } from "@/components/ui/NavIcon";
import type { UserMatchResponse } from "@/types/matches";
import { cx } from "@/lib/classNames";
import { formatInterestLabel } from "@/lib/interestEmoji";

export interface MatchListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick" | "onSelect"> {
  match: UserMatchResponse;
  selected?: boolean;
  onSelectMatch?: (matchId: string) => void;
  onProfileClick?: () => void;
  profileLabel?: string;
}

const formatName = (userId: string) => {
  const suffix = userId.slice(0, 6);
  return `Utente ${suffix}`;
};

const getDisplayName = (match: UserMatchResponse) => {
  const fullName = match.user?.fullName?.trim();
  if (fullName) return fullName;
  const username = match.user?.username?.trim();
  if (username) return username;
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
    return `${diffMinutes} min fa`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h fa`;
  }
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
  });
};

const LocationIcon = () => (
  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const DIMENSION_LABELS: Record<string, string> = {
  interests: "interessi",
  lifestyle: "stile di vita",
  values: "valori",
  objectives: "obiettivi",
  psy: "personalita",
  astro: "astrologia",
};

const buildMatchSummary = (match: UserMatchResponse): string => {
  const breakdown = match.breakdown as Record<string, unknown> | null;
  const parts: string[] = [];

  // Passioni condivise
  const sharedTags = breakdown?.sharedTags;
  const sharedCount = Array.isArray(sharedTags) ? sharedTags.length : typeof sharedTags === "number" ? sharedTags : 0;

  if (sharedCount > 0) {
    const sharedList = Array.isArray(sharedTags) ? sharedTags.slice(0, 3).join(", ") : "";
    if (sharedList) {
      const suffix = sharedCount > 3 ? "..." : "";
      parts.push(`${sharedCount} passioni in comune: ${sharedList}${suffix}`);
    } else {
      parts.push(`${sharedCount} passioni in comune`);
    }
  }

  // Altre dimensioni analizzate (escluso interests che e gia mostrato come passioni)
  const dimensions = breakdown?.dimensions as Record<string, number | null> | undefined;
  if (dimensions) {
    const analyzedDimensions = Object.entries(dimensions)
      .filter(([key, value]) => key !== "interests" && typeof value === "number" && value !== null)
      .map(([key]) => DIMENSION_LABELS[key] || key);

    if (analyzedDimensions.length > 0) {
      const dimText = analyzedDimensions.length === 1
        ? `analisi ${analyzedDimensions[0]}`
        : `analisi ${analyzedDimensions.slice(0, 2).join(", ")}${analyzedDimensions.length > 2 ? ` +${analyzedDimensions.length - 2}` : ""}`;
      parts.push(dimText);
    }
  }

  if (parts.length === 0) {
    return match.explanation ?? "Affinita calcolata sul profilo";
  }

  return parts.join(" · ");
};

export const MatchListItem = ({
  className,
  match,
  selected = false,
  onSelectMatch,
  onProfileClick,
  profileLabel,
  ...props
}: MatchListItemProps) => {
  const name = getDisplayName(match);
  const score = match.scoreTotal ?? 0;
  const matchSummary = buildMatchSummary(match);
  const updatedLabel = formatUpdatedAt(match.updatedAt);
  const breakdown = match.breakdown as Record<string, unknown> | null;
  const rawSharedTags = breakdown?.sharedTags;
  const sharedTagsArray: string[] = Array.isArray(rawSharedTags)
    ? rawSharedTags.filter((t): t is string => typeof t === "string")
    : [];
  const sharedTagsPreview = sharedTagsArray.slice(0, 3);
  const hasMoreTags = sharedTagsArray.length > 3;
  const location = formatLocation(match);
  const isSelectable = Boolean(onSelectMatch);

  const handleSelect = () => {
    if (!onSelectMatch) return;
    onSelectMatch(match.matchId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelectMatch) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectMatch(match.matchId);
    }
  };

  const handleProfileClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onProfileClick?.();
  };

  return (
    <div {...props}>
      <div
        role={isSelectable ? "button" : undefined}
        tabIndex={isSelectable ? 0 : undefined}
        className={cx(isSelectable && "w-full cursor-pointer text-left")}
        onClick={isSelectable ? handleSelect : undefined}
        onKeyDown={isSelectable ? handleKeyDown : undefined}
      >
        <div
          className={cx(
            "group flex flex-wrap items-start gap-4 rounded-[var(--radius-lg)] border bg-card p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border-strong sm:items-center",
            selected
              ? "border-accent/40 bg-accent-soft/30 shadow-md"
              : "border-border",
            className
          )}
        >
          {/* Avatar with gradient ring on hover */}
          <div className="relative">
            <div className={cx(
              "rounded-full p-0.5 transition-all duration-300",
              selected
                ? "bg-gradient-to-br from-accent to-accent"
                : "bg-transparent group-hover:bg-gradient-to-br group-hover:from-qa-match-gradient-start group-hover:to-qa-match-gradient-end"
            )}>
              <Avatar
                name={name}
                src={match.user?.avatarUrl ?? undefined}
                className={cx(
                  "transition-all duration-300",
                  selected ? "border-2 border-white" : "group-hover:border-2 group-hover:border-white"
                )}
              />
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-accent">
                {name}
              </p>
              {sharedTagsPreview.length > 0 ? (
                <>
                  {sharedTagsPreview.map((tag) => (
                    <Tag key={tag} tone="accent">
                      {formatInterestLabel(tag)}
                    </Tag>
                  ))}
                  {hasMoreTags && (
                    <Badge tone="neutral" size="sm">
                      +{sharedTagsArray.length - 3}
                    </Badge>
                  )}
                </>
              ) : null}
            </div>
            {location && (
              <p className="flex items-center gap-1 text-xs text-muted">
                <LocationIcon />
                {location}
              </p>
            )}
            <p className="text-xs text-muted">{matchSummary}</p>
            <p className="text-[11px] text-subtle">{updatedLabel}</p>
          </div>

          {/* Score */}
          <div className="flex flex-col items-end gap-2">
            {onProfileClick ? (
              <button
                type="button"
                onClick={handleProfileClick}
                aria-label={profileLabel ?? `Apri profilo di ${name}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <NavIcon name="user" className="h-4 w-4" />
              </button>
            ) : null}
            <MatchScoreBadge score={score} />
          </div>
        </div>
      </div>
    </div>
  );
};
