"use client";

import { useMemo } from "react";
import { onboardingActions } from "../../stores/onboarding/onboardingStore";
import { useOnboardingStore } from "../../stores/onboarding/useOnboardingStore";
import { useUserStore } from "../../stores/user/useUserStore";
import { useTagsStore } from "../../stores/tags/useTagsStore";
import { userActions } from "../../stores/user/userStore";
import { tagsActions } from "../../stores/tags/tagsStore";

export type OnboardingStep = {
  id: number;
  key: "profile" | "interests" | "preferences";
  completed: boolean;
};

// Onboarding semplificato: solo step 1 (profilo)
// Step 2 (passioni) e step 3 (preferenze) sono disponibili in /settings
const buildSteps = (
  hasProfile: boolean,
  _hasInterests: boolean,
  _hasPreferences: boolean
): OnboardingStep[] => [
  { id: 1, key: "profile", completed: hasProfile },
  // { id: 2, key: "interests", completed: hasInterests },
  // { id: 3, key: "preferences", completed: hasPreferences },
];

export const useOnboarding = () => {
  const onboardingState = useOnboardingStore();
  const userState = useUserStore();
  const tagsState = useTagsStore();

  const hasText = (value?: string | null) => Boolean(value && value.trim().length > 0);
  const hasProfile =
    hasText(userState.profile?.fullName)
    && hasText(userState.profile?.city)
    && hasText(userState.profile?.country);
  const hasPreferences = Boolean(userState.preferences);
  const hasInterests = Boolean(tagsState.interests?.tags?.length);

  const steps = buildSteps(
    hasProfile,
    hasInterests,
    hasPreferences
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
