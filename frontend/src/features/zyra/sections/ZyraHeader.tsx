"use client";

import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

const ZyraOrb = () => <ZyraMark size="md" />;

export interface ZyraHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  actionLabel?: string;
}

export const ZyraHeader = ({
  className,
  title,
  subtitle,
  statusLabel,
  actionLabel,
  ...props
}: ZyraHeaderProps) => {
  const { t } = useT();
  const resolvedTitle = title ?? t("Zyra");
  const resolvedSubtitle = subtitle ?? t("Your smart guide");
  const resolvedStatusLabel = statusLabel ?? t("Online");
  const resolvedActionLabel = actionLabel ?? t("New chat");

  return (
    <div
      className={cx("flex flex-wrap items-center justify-between gap-4", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <ZyraOrb />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              <span className="bg-gradient-to-r from-zyra-start via-zyra-mid to-zyra-end bg-clip-text text-transparent">
                {resolvedTitle}
              </span>
            </h3>
            {resolvedStatusLabel ? (
              <span className="rounded-full border border-border/70 bg-surface-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
                {resolvedStatusLabel}
              </span>
            ) : null}
          </div>
          {resolvedSubtitle ? (
            <p className="text-sm text-muted">{resolvedSubtitle}</p>
          ) : null}
        </div>
      </div>
      {resolvedActionLabel ? (
        <Button size="sm" variant="secondary">
          {resolvedActionLabel}
        </Button>
      ) : null}
    </div>
  );
};
