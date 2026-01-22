"use client";

import { useMemo } from "react";
import { tutorialActions } from "../../stores/tutorial/tutorialStore";
import { useTutorialStore } from "../../stores/tutorial/useTutorialStore";
import { tutorialSteps } from "../../features/tutorial/data/tutorialSteps";

export const useTutorial = () => {
  const tutorialState = useTutorialStore();

  const totalSteps = tutorialSteps.length;
  const currentStepData = tutorialSteps[tutorialState.currentStep] ?? null;
  const isFirstStep = tutorialState.currentStep === 0;
  const isLastStep = tutorialState.currentStep === totalSteps - 1;
  const progress = (tutorialState.currentStep + 1) / totalSteps;

  const shouldShow =
    !tutorialState.completed && !tutorialState.skipped && tutorialState.isOpen;

  const actions = useMemo(
    () => ({
      hydrate: tutorialActions.hydrate,
      open: tutorialActions.open,
      close: tutorialActions.close,
      nextStep: tutorialActions.nextStep,
      previousStep: tutorialActions.previousStep,
      goToStep: tutorialActions.goToStep,
      skip: tutorialActions.skip,
      complete: tutorialActions.complete,
      reset: tutorialActions.reset,
      shouldShowTutorial: tutorialActions.shouldShowTutorial,
    }),
    []
  );

  return {
    ...tutorialState,
    totalSteps,
    currentStepData,
    isFirstStep,
    isLastStep,
    progress,
    shouldShow,
    steps: tutorialSteps,
    actions,
  };
};
