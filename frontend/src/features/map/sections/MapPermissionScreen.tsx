"use client";

import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

const MapIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
    <path d="M9 3v15" />
    <path d="M15 6v15" />
  </svg>
);

const LocationPinIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export interface MapPermissionScreenProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  helper?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

const BENEFITS = [
  "Nearby places and experiences",
  "Matches based on your area",
  "A feed with local content",
];

export const MapPermissionScreen = ({
  className,
  title,
  description,
  primaryActionLabel,
  secondaryActionLabel,
  helper,
  onPrimaryAction,
  onSecondaryAction,
  ...props
}: MapPermissionScreenProps) => {
  const { t } = useT();

  const resolvedTitle = title ? t(title) : t("Enable location");
  const resolvedDescription = description
    ? t(description)
    : t("Share your location to discover nearby places and improve suggestions.");
  const resolvedPrimaryActionLabel = primaryActionLabel
    ? t(primaryActionLabel)
    : t("Enable location");
  const resolvedSecondaryActionLabel = secondaryActionLabel
    ? t(secondaryActionLabel)
    : t("Continue without");

  return (
    <div
      className={cx(
        "group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--qa-map-border)] bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-[0_8px_30px_var(--qa-map-glow)]",
        className
      )}
      style={{
        background: "linear-gradient(135deg, var(--qa-map-bg) 0%, transparent 60%)",
      }}
      {...props}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[var(--qa-map-gradient-start)]/20 blur-3xl transition-transform duration-500 group-hover:scale-150" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
        {/* Icon */}
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-white shadow-md"
          style={{
            background:
              "linear-gradient(135deg, var(--qa-map-gradient-start), var(--qa-map-gradient-end))",
          }}
        >
          <MapIcon />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {resolvedTitle}
            </h3>
            {resolvedDescription ? (
              <p className="text-sm text-muted">{resolvedDescription}</p>
            ) : null}
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap gap-2">
            {BENEFITS.map((benefit, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full bg-[var(--qa-map-bg)] px-2.5 py-1 text-xs font-medium text-[var(--qa-map-gradient-end)]"
              >
                <LocationPinIcon />
                {t(benefit)}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              size="sm"
              onClick={onPrimaryAction}
              className="bg-gradient-to-r from-[var(--qa-map-gradient-start)] to-[var(--qa-map-gradient-end)] text-white shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-[var(--qa-map-glow)]"
            >
              {resolvedPrimaryActionLabel}
            </Button>
            <Button size="sm" variant="ghost" onClick={onSecondaryAction}>
              {resolvedSecondaryActionLabel}
            </Button>
          </div>

          {helper ? <p className="text-xs text-subtle">{t(helper)}</p> : null}
        </div>
      </div>
    </div>
  );
};
