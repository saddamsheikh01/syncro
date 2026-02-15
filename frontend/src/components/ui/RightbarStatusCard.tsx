"use client";

import type { HTMLAttributes } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useT, useUser } from "@/hooks";
import { cx } from "@/lib/classNames";

const StatusDot = ({ className }: { className?: string }) => (
  <span
    className={cx(
      "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent/60",
      className
    )}
    aria-hidden="true"
  />
);

export type RightbarStatusCardProps = HTMLAttributes<HTMLDivElement>;

export const RightbarStatusCard = ({
  className,
  ...props
}: RightbarStatusCardProps) => {
  const { t } = useT();
  const { profile, actions } = useUser();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchProfile().catch(() => undefined);
  }, [actions]);

  const city = profile?.city?.trim();
  const country = profile?.country?.trim();
  const location = [city, country].filter(Boolean).join(", ");

  const focusLabel = useMemo(() => {
    const goals = profile?.goalsText?.trim();
    if (goals) return goals.split(",")[0]?.trim();
    return t("Exploration");
  }, [profile?.goalsText, t]);

  const items = [
    t("Currently in {location}", { location: location || t("Milan") }),
    t("Current focus: {focus}", { focus: focusLabel }),
    t("Open to new connections"),
  ];

  return (
    <div className={cx("space-y-2", className)} {...props}>
      <p className="text-xs font-semibold text-foreground">{t("Your Status")}</p>
      <div className="space-y-1.5 text-xs text-muted">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2">
            <StatusDot className="bg-emerald-400/70" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
