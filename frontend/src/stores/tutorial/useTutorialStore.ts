"use client";

import { useStore } from "../utils/useStore";
import { tutorialStore, type TutorialState } from "./tutorialStore";

export const useTutorialStore = <Selected = TutorialState>(
  selector?: (state: TutorialState) => Selected
): Selected => {
  return useStore(tutorialStore, selector);
};
