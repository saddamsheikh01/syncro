export type TutorialStepIcon = "setup" | "tests";

export type TutorialStep = {
  id: string;
  icon: TutorialStepIcon;
  title: string;
  description: string;
  highlight?: string;
};

export const tutorialSteps: TutorialStep[] = [
  {
    id: "setup",
    icon: "setup",
    title: "Complete your profile",
    description:
      "Add your passions and key info: it only takes a few minutes to make your profile truly useful.",
    highlight: "Go to Settings and complete your profile.",
  },
  {
    id: "tests",
    icon: "tests",
    title: "Start the tests",
    description:
      "Micro-tests improve matches and help Zyra understand you better.",
    highlight: "We recommend starting with the first available tests.",
  },
];
