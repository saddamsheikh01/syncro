"use client";

import { useStore } from "../utils/useStore";
import type { OnboardingState } from "./onboardingStore";
import { onboardingStore } from "./onboardingStore";

export const useOnboardingStore = <Selected = OnboardingState>(
  selector?: (state: OnboardingState) => Selected
) => useStore(onboardingStore, selector);
