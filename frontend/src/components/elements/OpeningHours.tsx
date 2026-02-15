"use client";

import { useState } from "react";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

export interface OpeningHoursData {
  openNow?: boolean;
  weekdayText?: string[];
  periods?: Array<{
    openDay?: number;
    openTime?: string;
    closeDay?: number;
    closeTime?: string;
  }>;
}

export interface OpeningHoursProps {
  data: OpeningHoursData;
  className?: string;
}

export const OpeningHours = ({ data, className }: OpeningHoursProps) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useT();

  const hasWeekdayText = data.weekdayText && data.weekdayText.length > 0;

  return (
    <div className={cx("space-y-2", className)}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-sm font-medium text-foreground">
            {t("Opening hours")}
          </span>
          {data.openNow !== undefined && (
            <span
              className={cx(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                data.openNow
                  ? "bg-success/10 text-success"
                  : "bg-danger/10 text-danger"
              )}
            >
              {data.openNow ? t("Open now") : t("Closed now")}
            </span>
          )}
        </div>
        {hasWeekdayText && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cx(
              "text-muted transition-transform",
              expanded && "rotate-180"
            )}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>

      {expanded && hasWeekdayText && (
        <ul className="space-y-1 pl-6">
          {data.weekdayText!.map((text, index) => (
            <li key={index} className="text-sm text-muted">
              {text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
