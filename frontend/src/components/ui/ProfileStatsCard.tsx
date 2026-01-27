"use client";

import { useEffect, useRef } from "react";
import { useMatches, useTags, useTests } from "@/hooks";
import { cx } from "@/lib/classNames";

const SparkIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

interface StatItemProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}

const StatItem = ({ icon, value, label, color }: StatItemProps) => (
  <div className="flex flex-col items-center gap-1 text-center">
    <div className={cx("flex h-8 w-8 items-center justify-center rounded-full", color)}>
      {icon}
    </div>
    <p className="text-sm font-semibold text-foreground">{value}</p>
    <p className="text-[10px] text-muted">{label}</p>
  </div>
);

export const ProfileStatsCard = () => {
  const { userMatches, actions: matchActions } = useMatches();
  const { interests, actions: tagsActions } = useTags();
  const { completedCount, countLoading, actions: testsActions } = useTests();

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    matchActions.fetchUserMatches({ size: 100 }).catch(() => undefined);
    tagsActions.fetchUserInterests().catch(() => undefined);
    testsActions.fetchCompletedCount().catch(() => undefined);
  }, [matchActions, tagsActions, testsActions]);

  const matchCount = userMatches.length;
  const interestCount = interests?.tags?.length ?? 0;
  const testCount =
    countLoading && completedCount == null ? "..." : completedCount ?? 0;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-foreground">Il tuo profilo</p>
      <div className="flex items-center justify-around rounded-[var(--radius-lg)] border border-border/60 bg-surface-muted/50 p-3">
        <StatItem
          icon={<SparkIcon />}
          value={matchCount}
          label="Match"
          color="bg-qa-match-bg text-[var(--qa-match-gradient-start)]"
        />
        <div className="h-10 w-px bg-border/60" />
        <StatItem
          icon={<HeartIcon />}
          value={interestCount}
          label="Interessi"
          color="bg-qa-experiences-bg text-[var(--qa-experiences-gradient-start)]"
        />
        <div className="h-10 w-px bg-border/60" />
        <StatItem
          icon={<ClipboardIcon />}
          value={testCount}
          label="Test"
          color="bg-qa-tests-bg text-[var(--qa-tests-gradient-start)]"
        />
      </div>
    </div>
  );
};
