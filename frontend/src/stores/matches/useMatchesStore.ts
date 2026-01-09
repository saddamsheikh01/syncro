"use client";

import { useStore } from "../utils/useStore";
import type { MatchesState } from "./matchesStore";
import { matchesStore } from "./matchesStore";

export const useMatchesStore = <Selected = MatchesState>(
  selector?: (state: MatchesState) => Selected
) => useStore(matchesStore, selector);
