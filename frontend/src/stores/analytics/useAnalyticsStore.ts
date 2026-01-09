"use client";

import { useStore } from "../utils/useStore";
import type { AnalyticsState } from "./analyticsStore";
import { analyticsStore } from "./analyticsStore";

export const useAnalyticsStore = <Selected = AnalyticsState>(
  selector?: (state: AnalyticsState) => Selected
) => useStore(analyticsStore, selector);
