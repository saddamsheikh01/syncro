import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";

export interface OnboardingStepHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  overline?: string;
  showProgress?: boolean;
}

export const OnboardingStepHeader = ({
  className,
  title,
  subtitle,
  step,
  totalSteps,
  overline = "Onboarding",
  showProgress,
  ...props
}: OnboardingStepHeaderProps) => {
  const hasProgress =
    typeof step === "number" && typeof totalSteps === "number" && totalSteps > 0;
  const progress = hasProgress ? (step / totalSteps) * 100 : 0;
  const showStep = hasProgress && (showProgress ?? true);

  return (
    <div className={cx("space-y-3", className)} {...props}>
      <div className="flex flex-wrap items-center gap-2">
        {overline ? (
          <Badge tone="accent" size="sm">
            {overline}
          </Badge>
        ) : null}
        {showStep ? (
          <span className="text-xs font-semibold text-subtle">
            Step {step}/{totalSteps}
          </span>
        ) : null}
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
      {showStep ? (
        <div className="h-2 w-full rounded-full bg-surface-muted/80">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  );
};
