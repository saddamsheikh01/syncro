"use client";

import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import type { TutorialStep, TutorialStepIcon } from "../data/tutorialSteps";

export interface TutorialStepContentProps {
  step: TutorialStep;
  className?: string;
}

const iconColorClasses: Record<TutorialStepIcon, string> = {
  setup: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
  tests: "bg-[var(--qa-tests-bg)] text-[var(--qa-tests-gradient-start)]",
};

const renderStepIcon = (icon: TutorialStepIcon) => {
  switch (icon) {
    case "setup":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case "tests":
      return <NavIcon name="clipboard" className="h-8 w-8" />;
    default:
      return <NavIcon name="star" className="h-8 w-8" />;
  }
};

export const TutorialStepContent = ({
  step,
  className,
}: TutorialStepContentProps) => {
  return (
    <div className={cx("flex flex-col items-center text-center", className)}>
      <div
        className={cx(
          "mb-6 flex h-20 w-20 items-center justify-center rounded-[var(--radius-xl)]",
          iconColorClasses[step.icon]
        )}
      >
        {renderStepIcon(step.icon)}
      </div>

      <h3 className="mb-3 text-xl font-semibold text-foreground">
        {step.title}
      </h3>

      <p className="mb-4 text-sm leading-relaxed text-muted">
        {step.description}
      </p>

      {step.highlight ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--qa-tests-border)] bg-[var(--qa-tests-bg)] px-4 py-3">
          <p className="text-xs font-medium text-[var(--qa-tests-gradient-start)]">
            {step.highlight}
          </p>
        </div>
      ) : null}
    </div>
  );
};
