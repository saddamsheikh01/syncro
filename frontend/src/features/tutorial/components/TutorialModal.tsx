"use client";

import { useEffect, useCallback, useState } from "react";
import { cx } from "@/lib/classNames";
import { Button } from "@/components/buttons/Button";
import { Switch } from "@/components/elements/Switch";
import { TutorialProgress } from "./TutorialProgress";
import { TutorialStepContent } from "./TutorialStepContent";
import { tutorialSteps } from "../data/tutorialSteps";

export interface TutorialModalProps {
  open: boolean;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
  onComplete: () => void;
  onStepClick?: (step: number) => void;
}

export const TutorialModal = ({
  open,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onClose,
  onComplete,
  onStepClick,
}: TutorialModalProps) => {
  const totalSteps = tutorialSteps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const step = tutorialSteps[currentStep];

  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleSkip = useCallback(() => {
    if (dontShowAgain) {
      onSkip();
    } else {
      onClose();
    }
  }, [dontShowAgain, onSkip, onClose]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleSkip();
      } else if (event.key === "ArrowRight" && !isLastStep) {
        onNext();
      } else if (event.key === "ArrowLeft" && !isFirstStep) {
        onPrevious();
      } else if (event.key === "Enter" && isLastStep) {
        onComplete();
      }
    },
    [isFirstStep, isLastStep, onNext, onPrevious, handleSkip, onComplete]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !step) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tutorial"
    >
      <div
        className={cx(
          "relative flex w-full max-w-md flex-col",
          "rounded-[var(--radius-xl)] border border-border bg-card",
          "shadow-lg"
        )}
      >
        <button
          type="button"
          onClick={handleSkip}
          className={cx(
            "absolute right-4 top-4 p-2 text-muted transition hover:text-foreground",
            "rounded-[var(--radius-sm)] hover:bg-surface-muted"
          )}
          aria-label="Skip tutorial"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col px-6 pb-6 pt-12">
          <TutorialStepContent step={step} className="mb-8" />

          <TutorialProgress
            currentStep={currentStep}
            totalSteps={totalSteps}
            onStepClick={onStepClick}
          />

          <Switch
            label="Don't show again"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="mt-6"
          />

          <div className="mt-6 flex items-center gap-3">
            {!isFirstStep ? (
              <Button
                variant="ghost"
                size="md"
                onClick={onPrevious}
                className="flex-1"
              >
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="md"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip
              </Button>
            )}

            {isLastStep ? (
              <Button
                variant="primary"
                size="md"
                onClick={onComplete}
                className="flex-1"
              >
                Start
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={onNext}
                className="flex-1"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
