import { createStore } from "../utils/createStore";
import { readStorage, writeStorage } from "../utils/storage";

const TUTORIAL_STORAGE_KEY = "syncro.onboarding-intro.state";

export type TutorialState = {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  skipped: boolean;
  isOpen: boolean;
};

type PersistedTutorialState = {
  completed: boolean;
  skipped: boolean;
};

const initialState: TutorialState = {
  currentStep: 0,
  totalSteps: 1,
  completed: false,
  skipped: false,
  isOpen: false,
};

export const tutorialStore = createStore<TutorialState>(initialState);

const persistState = () => {
  const state = tutorialStore.getState();
  const persisted: PersistedTutorialState = {
    completed: state.completed,
    skipped: state.skipped,
  };
  writeStorage(TUTORIAL_STORAGE_KEY, persisted);
};

export const tutorialActions = {
  hydrate: () => {
    const persisted = readStorage<PersistedTutorialState | null>(
      TUTORIAL_STORAGE_KEY,
      null
    );
    if (persisted) {
      tutorialStore.setState({
        completed: persisted.completed,
        skipped: persisted.skipped,
      });
    }
  },

  open: () => {
    tutorialStore.setState({ isOpen: true, currentStep: 0 });
  },

  close: () => {
    tutorialStore.setState({ isOpen: false });
  },

  nextStep: () => {
    const { currentStep, totalSteps } = tutorialStore.getState();
    if (currentStep < totalSteps - 1) {
      tutorialStore.setState({ currentStep: currentStep + 1 });
    }
  },

  previousStep: () => {
    const { currentStep } = tutorialStore.getState();
    if (currentStep > 0) {
      tutorialStore.setState({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (step: number) => {
    const { totalSteps } = tutorialStore.getState();
    if (step >= 0 && step < totalSteps) {
      tutorialStore.setState({ currentStep: step });
    }
  },

  skip: () => {
    tutorialStore.setState({
      skipped: true,
      isOpen: false,
      currentStep: 0,
    });
    persistState();
  },

  complete: () => {
    tutorialStore.setState({
      completed: true,
      isOpen: false,
      currentStep: 0,
    });
    persistState();
  },

  reset: () => {
    tutorialStore.setState(initialState, true);
    writeStorage(TUTORIAL_STORAGE_KEY, null);
  },

  shouldShowTutorial: (): boolean => {
    const { completed, skipped } = tutorialStore.getState();
    return !completed && !skipped;
  },
};
