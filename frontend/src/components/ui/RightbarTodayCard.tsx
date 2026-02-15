"use client";

import type { HTMLAttributes } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useCatalog, useMatches, useT } from "@/hooks";
import { cx } from "@/lib/classNames";

const TodayDot = ({ className }: { className?: string }) => (
  <span
    className={cx("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", className)}
    aria-hidden="true"
  />
);

export interface RightbarTodayCardProps extends HTMLAttributes<HTMLDivElement> {}

export const RightbarTodayCard = ({
  className,
  ...props
}: RightbarTodayCardProps) => {
  const { t } = useT();
  const { userMatches, actions: matchesActions } = useMatches();
  const { places, actions: catalogActions } = useCatalog();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    matchesActions.fetchUserMatches({ size: 3 }).catch(() => undefined);
    catalogActions.fetchPlaces({ size: 2 }).catch(() => undefined);
  }, [catalogActions, matchesActions]);

  const items = useMemo(
    () => [
      {
        label: t("{count} compatible people nearby", {
          count: Math.max(userMatches.length, 1),
        }),
        tone: "bg-rose-400/70",
      },
      {
        label: t("{count} aligned places", { count: Math.max(places.length, 1) }),
        tone: "bg-blue-400/70",
      },
      {
        label: t("1 live experience right now"),
        tone: "bg-amber-400/70",
      },
    ],
    [places.length, t, userMatches.length]
  );

  return (
    <div className={cx("space-y-2", className)} {...props}>
      <p className="text-xs font-semibold text-foreground">
        {t("Today For You")}
      </p>
      <div className="space-y-1.5 text-xs text-muted">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            <TodayDot className={item.tone} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
