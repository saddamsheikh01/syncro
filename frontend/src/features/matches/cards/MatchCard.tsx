import Link from "next/link";
import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import {
  resolveMatchDomainScores,
} from "@/lib/matchDomains";
import { resolveMatchCopy } from "@/lib/matchCopy";
import type { UserMatchResponse } from "@/types/matches";

const DEFAULT_MATCH_DESCRIPTION =
  "Relevant connection based on your current context.";

const resolveDescription = (value?: string | null) => {
  return resolveMatchCopy(value, DEFAULT_MATCH_DESCRIPTION);
};

export interface MatchCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  match: UserMatchResponse;
  href?: string;
  onPress?: () => void;
  onOpen?: () => void;
  showDomainTag?: boolean;
  showScore?: boolean;
  scoreLabel?: string;
  descriptionOverride?: string | null;
}

const resolveName = (match: UserMatchResponse) =>
  match.user?.fullName?.trim() ||
  match.user?.username?.trim() ||
  `User ${match.userId.slice(0, 6)}`;

const resolveLocation = (match: UserMatchResponse) =>
  [match.user?.city, match.user?.country].filter(Boolean).join(", ");

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
};

export const MatchCard = ({
  match,
  href,
  onPress,
  onOpen,
  showDomainTag = true,
  showScore = true,
  scoreLabel = "Overall",
  descriptionOverride,
  className,
  ...props
}: MatchCardProps) => {
  const name = resolveName(match);
  const location = resolveLocation(match);
  const domainScores = showDomainTag
    ? resolveMatchDomainScores(match.breakdown)
    : [];
  const score = Math.round(match.scoreTotal ?? 0);
  const description = descriptionOverride ?? resolveDescription(match.explanation);
  const imageUrl = match.user?.avatarUrl ?? null;
  const initials = getInitials(name);

  const card = (
    <div
      className={cx(
        "group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-border-strong hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="relative h-36 w-full overflow-hidden bg-surface-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#eaf1ff] via-[#f2f6ff] to-[#e9effc] text-2xl font-semibold text-subtle">
            {initials}
          </div>
        )}
        {showScore ? (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-sm whitespace-nowrap">
            {scoreLabel} {score}%
          </div>
        ) : (
          <div className="absolute right-3 top-3 rounded-full border border-border/70 bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-subtle shadow-sm">
            No match
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          {location ? <span className="text-xs text-subtle">{location}</span> : null}
        </div>
        {domainScores.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {domainScores.map((domain, index) => (
              <span
                key={domain.domain}
                title={`${domain.label}: ${Math.round(domain.score)}%`}
                className={cx(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  index === 0
                    ? "bg-accent-soft text-accent"
                    : "bg-surface-muted text-foreground"
                )}
              >
                {domain.emoji} {Math.round(domain.score)}%
              </span>
            ))}
          </div>
        ) : null}
        <p className="line-clamp-2 text-xs text-muted">{description}</p>
        <div className="mt-auto flex items-center justify-between text-[11px] text-subtle">
          <span>View Profile</span>
          <span className="text-accent">→</span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block" onClick={onOpen}>
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
