"use client";

import { useStore } from "../utils/useStore";
import { expatsModeStore } from "./expatsModeStore";
import type { ExpatsModeState } from "./expatsModeStore";

export const useExpatsModeStore = <T = ExpatsModeState>(
  selector?: (state: ExpatsModeState) => T
): T => useStore(expatsModeStore, selector);
