"use client";

import { useStore } from "../utils/useStore";
import type { UiState } from "./uiStore";
import { uiStore } from "./uiStore";

export const useUiStore = <Selected = UiState>(
  selector?: (state: UiState) => Selected
) => useStore(uiStore, selector);
