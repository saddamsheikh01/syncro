"use client";

import { useMemo } from "react";
import { onboardingActions } from "../../stores/onboarding/onboardingStore";
import { useOnboardingStore } from "../../stores/onboarding/useOnboardingStore";
import { useUserStore } from "../../stores/user/useUserStore";
import { useTagsStore } from "../../stores/tags/useTagsStore";
import { usePositionStore } from "../../stores/position/usePositionStore";
import { userActions } from "../../stores/user/userStore";
import { tagsActions } from "../../stores/tags/tagsStore";
import { positionActions } from "../../stores/position/positionStore";

export type OnboardingStep = {
  id: number;
  key: "profile" | "interests" | "preferences" | "position";
  completed: boolean;
};

const buildSteps = (
  hasProfile: boolean,
  hasInterests: boolean,
  hasPreferences: boolean,
  hasPosition: boolean
): OnboardingStep[] => [
  { id: 1, key: "profile", completed: hasProfile },
  { id: 2, key: "interests", completed: hasInterests },
  { id: 3, key: "preferences", completed: hasPreferences },
  { id: 4, key: "position", completed: hasPosition },
];

export const useOnboarding = () => {
  const onboardingState = useOnboardingStore();
  const userState = useUserStore();
  const tagsState = useTagsStore();
  const positionState = usePositionStore();

  const hasProfile = Boolean(userState.profile);
  const hasPreferences = Boolean(userState.preferences);
  const hasInterests = Boolean(tagsState.interests?.tags?.length);
  const hasPosition =
    positionState.position !== null &&
    positionState.position.latitude !== null &&
    positionState.position.longitude !== null;

  const steps = buildSteps(
    hasProfile,
    hasInterests,
    hasPreferences,
    hasPosition
  );

  const completedSteps = steps.filter((step) => step.completed).map((step) => step.id);
  const progress = completedSteps.length / steps.length;
  const nextStep = steps.find((step) => !step.completed)?.id ?? steps.length;
  const isComplete = completedSteps.length === steps.length;

  const actions = useMemo(
    () => ({
      setCurrentStep: onboardingActions.setCurrentStep,
      completeStep: onboardingActions.completeStep,
      reset: onboardingActions.reset,
      saveProfile: userActions.saveProfile,
      savePreferences: userActions.savePreferences,
      updateUserInterests: tagsActions.updateUserInterests,
      savePosition: positionActions.savePosition,
    }),
    []
  );

  return {
    ...onboardingState,
    steps,
    completedSteps,
    nextStep,
    progress,
    isComplete,
    actions,
  };
};
