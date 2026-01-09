"use client";

import { useStore } from "../utils/useStore";
import type { TestsState } from "./testsStore";
import { testsStore } from "./testsStore";

export const useTestsStore = <Selected = TestsState>(
  selector?: (state: TestsState) => Selected
) => useStore(testsStore, selector);
