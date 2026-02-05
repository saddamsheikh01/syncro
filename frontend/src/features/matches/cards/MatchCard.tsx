import Link from "next/link";
import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import type { UserMatchResponse } from "@/types/matches";

const DEFAULT_MATCH_DESCRIPTION =
  "Relevant connection based on your current context.";

const ITALIAN_DESCRIPTION_HINTS = [
  "interessi",
  "valori",
  "obiettivi",
  "affin",
  "compatibil",
  "condivis",
  "vicin",
  "citta",
  "luogo",
  "esperien",
  "profilo",
  "amicizia",
  "amore",
  "lavoro",
  "contesto",
  "buona",
  "energia",
];

const looksItalian = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ITALIAN_DESCRIPTION_HINTS.some((hint) =>
    normalized.includes(hint)
  );
};

const resolveDescription = (value?: string | null) => {
  if (!value) return DEFAULT_MATCH_DESCRIPTION;
  return looksItalian(value) ? DEFAULT_MATCH_DESCRIPTION : value;
};

export interface MatchCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  match: UserMatchResponse;
  href?: string;
  onPress?: () => void;
}

const resolveName = (match: UserMatchResponse) =>
  match.user?.fullName?.trim() ||
  match.user?.username?.trim() ||
  `User ${match.userId.slice(0, 6)}`;

const resolveLocation = (match: UserMatchResponse) =>
  [match.user?.city, match.user?.country].filter(Boolean).join(", ");

const resolveCategory = (match: UserMatchResponse) => {
  const breakdown = match.breakdown as Record<string, unknown> | null;
  const domains = (breakdown?.domains ?? {}) as Record<string, number | null>;
  const entries = Object.entries(domains).filter(([, value]) => typeof value === "number");
  if (entries.length === 0) return "Connections";
  const [topKey] = entries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
  const labelMap: Record<string, string> = {
    work: "Work",
    friendship: "Friends",
    love: "Relationships",
    projects: "Goals",
    hobby: "Share Interests",
    growth: "Learn & Grow",
  };
  return labelMap[topKey] ?? "Connections";
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
};

export const MatchCard = ({ match, href, onPress, className, ...props }: MatchCardProps) => {
  const name = resolveName(match);
  const location = resolveLocation(match);
  const category = resolveCategory(match);
  const score = Math.round(match.scoreTotal ?? 0);
  const description = resolveDescription(match.explanation);
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
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
          {score}%
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          {location ? <span className="text-xs text-subtle">{location}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
            {score}% {category}
          </span>
        </div>
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
