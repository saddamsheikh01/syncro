"use client";

import { useCallback } from "react";
import { useBudgetStore } from "../../stores/expats/useBudgetStore";
import { budgetActions } from "../../stores/expats/budgetStore";

export const useRisk = () => {
  const status = useBudgetStore((s) => s.status);
  const error = useBudgetStore((s) => s.error);
  const riskSnapshot = useBudgetStore((s) => s.riskSnapshot);

  const isLoading = status === "loading";

  const loadRiskIndicators = useCallback(() => budgetActions.loadRiskIndicators(), []);

  return {
    status,
    error,
    isLoading,
    riskSnapshot,
    loadRiskIndicators,
  };
};
