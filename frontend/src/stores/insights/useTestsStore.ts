"use client";

import { useStore } from "../utils/useStore";
import type { TestsState } from "./insightsStore";
import { testsStore } from "./insightsStore";

export const useTestsStore = <Selected = TestsState>(
  selector?: (state: TestsState) => Selected
) => useStore(testsStore, selector);
