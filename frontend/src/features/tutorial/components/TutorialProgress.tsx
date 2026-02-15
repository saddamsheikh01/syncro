"use client";

import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

export interface TutorialProgressProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export const TutorialProgress = ({
  currentStep,
  totalSteps,
  onStepClick,
}: TutorialProgressProps) => {
  const { t } = useT();

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onStepClick?.(index)}
            disabled={!onStepClick}
            aria-label={t("Go to step {index}", { index: index + 1 })}
            aria-current={isActive ? "step" : undefined}
            className={cx(
              "h-2 rounded-full transition-all duration-300",
              isActive && "w-6 bg-accent",
              isCompleted && "w-2 bg-accent/60",
              !isActive && !isCompleted && "w-2 bg-border",
              onStepClick && "cursor-pointer hover:bg-accent/80",
              !onStepClick && "cursor-default"
            )}
          />
        );
      })}
    </div>
  );
};
