"use client";

import type { HTMLAttributes } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useMatches, useT } from "@/hooks";
import { cx } from "@/lib/classNames";

const Bullet = ({ className }: { className?: string }) => (
  <span
    className={cx(
      "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent/60",
      className
    )}
    aria-hidden="true"
  />
);

export interface RightbarMatchSummaryProps
  extends HTMLAttributes<HTMLDivElement> {}

export const RightbarMatchSummary = ({
  className,
  ...props
}: RightbarMatchSummaryProps) => {
  const { t } = useT();
  const { userMatches, recommendations, actions } = useMatches();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchUserMatches({ size: 4 }).catch(() => undefined);
    actions.fetchRecommendations({ size: 4 }).catch(() => undefined);
  }, [actions]);

  const alignedPeopleCount = userMatches.length;
  const alignedPlacesCount = useMemo(
    () => recommendations.filter((item) => item.type === "PLACE").length,
    [recommendations]
  );
  const alignedExperiencesCount = useMemo(
    () => recommendations.filter((item) => item.type === "EXPERIENCE").length,
    [recommendations]
  );

  const items = [
    {
      label:
        alignedPeopleCount > 0
          ? t("{count} aligned people near you", { count: alignedPeopleCount })
          : t("New matches coming soon"),
      tone: "bg-rose-400/70",
    },
    {
      label:
        alignedPlacesCount > 0
          ? t("{count} compatible places", { count: alignedPlacesCount })
          : t("1 compatible place"),
      tone: "bg-emerald-400/70",
    },
    {
      label:
        alignedExperiencesCount > 0
          ? t("{count} suggested experiences", { count: alignedExperiencesCount })
          : t("1 experience in progress"),
      tone: "bg-amber-400/70",
    },
  ];

  return (
    <div className={cx("space-y-2", className)} {...props}>
      <p className="text-xs font-semibold text-foreground">
        {t("Other matches aligned with you")}
      </p>
      <div className="space-y-1.5 text-xs text-muted">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            <Bullet className={item.tone} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
