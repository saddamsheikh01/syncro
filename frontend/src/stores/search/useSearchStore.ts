"use client";

import { useStore } from "../utils/useStore";
import { searchStore, searchActions } from "./searchStore";
import type { SearchState } from "./searchStore";

export const useSearchStore = <T = SearchState>(
  selector?: (state: SearchState) => T
): T => useStore(searchStore, selector);

export { searchActions };
