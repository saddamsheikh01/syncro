"use client";

import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { NavIcon } from "@/components/ui/NavIcon";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export interface InsightsDbLanguageDisclaimerProps
  extends HTMLAttributes<HTMLDivElement> {}

export const InsightsDbLanguageDisclaimer = ({
  className,
  ...props
}: InsightsDbLanguageDisclaimerProps) => {
  const { t } = useT();

  return (
    <Card
      className={cx(
        "flex items-start gap-3 border-accent/20 bg-accent-soft p-4 text-foreground",
        className
      )}
      {...props}
    >
      <NavIcon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
      <p className="text-xs text-muted">
        {t("Insights are currently available in English only.")}
      </p>
    </Card>
  );
};

