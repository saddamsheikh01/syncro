"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Avatar } from "@/components/elements/Avatar";
import { useMatches } from "@/hooks";
import { cx } from "@/lib/classNames";

const SparkIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
  </svg>
);

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-success bg-success/10 border-success/30";
  if (score >= 65) return "text-accent bg-accent/10 border-accent/30";
  if (score >= 50) return "text-warning bg-warning/10 border-warning/30";
  return "text-muted bg-surface-muted border-border";
};

export const QuickMatchPreview = () => {
  const { userMatches, loadingUserMatches, actions } = useMatches();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchUserMatches({ size: 1 }).catch(() => undefined);
  }, [actions]);

  const match = userMatches[0];

  if (loadingUserMatches && !match) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border/60 bg-card p-3">
        <div className="h-10 w-10 animate-pulse rounded-full bg-surface-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-surface-muted" />
        </div>
      </div>
    );
  }

  if (!match) return null;

  const name =
    match.user?.fullName?.trim() || `Utente ${match.userId.slice(0, 6)}`;
  const location = [match.user?.city, match.user?.country]
    .filter(Boolean)
    .join(", ");
  const score = Math.round(match.scoreTotal ?? 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">
          Match del giorno
        </p>
        <Link
          href="/matches"
          className="text-[10px] font-medium text-accent hover:underline"
        >
          Vedi tutti
        </Link>
      </div>
      <Link
        href="/matches"
        className={cx(
          "group flex items-center gap-3 rounded-[var(--radius-lg)] border border-qa-match-border/50 p-3 transition-all duration-300",
          "hover:border-qa-match-border hover:shadow-[0_6px_20px_var(--qa-match-glow)]",
        )}
        style={{
          background:
            "linear-gradient(135deg, var(--qa-match-bg) 0%, transparent 60%)",
        }}
      >
        {/* Avatar with gradient ring */}
        <div className="relative">
          <div className="rounded-full bg-gradient-to-br from-qa-match-gradient-start to-qa-match-gradient-end p-0.5">
            <Avatar
              name={name}
              src={match.user?.avatarUrl ?? undefined}
              size="md"
              className="border-2 border-white"
            />
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-[var(--qa-match-gradient-start)]">
            {name}
          </p>
          {location && (
            <p className="truncate text-xs text-muted">{location}</p>
          )}
        </div>

        {/* Score badge */}
        <div
          className={cx(
            "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
            getScoreColor(score),
          )}
        >
          <SparkIcon />
          {score}%
        </div>
      </Link>
    </div>
  );
};
