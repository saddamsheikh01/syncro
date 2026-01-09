import { createStore } from "../utils/createStore";

export type OnboardingState = {
  currentStep: number;
  completedSteps: number[];
};

const initialState: OnboardingState = {
  currentStep: 1,
  completedSteps: [],
};

export const onboardingStore = createStore<OnboardingState>(initialState);

export const onboardingActions = {
  setCurrentStep: (step: number) => {
    onboardingStore.setState({ currentStep: step });
  },

  completeStep: (step: number) => {
    onboardingStore.setState((state) => ({
      completedSteps: state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step],
    }));
  },

  reset: () => {
    onboardingStore.setState(initialState, true);
  },
};
