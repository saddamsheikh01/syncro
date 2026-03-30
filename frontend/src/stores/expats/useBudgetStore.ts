"use client";

import { useStore } from "../utils/useStore";
import { budgetStore } from "./budgetStore";
import type { BudgetStoreState } from "./budgetStore";

export const useBudgetStore = <T = BudgetStoreState>(
  selector?: (state: BudgetStoreState) => T
): T => useStore(budgetStore, selector);
