"use client";

import { useCallback } from "react";
import { useBudgetStore } from "../../stores/expats/useBudgetStore";
import { budgetActions } from "../../stores/expats/budgetStore";
import type { GenerateStarterKitRequest } from "../../types/expats";

export const useStarterKit = () => {
  const status = useBudgetStore((s) => s.status);
  const error = useBudgetStore((s) => s.error);
  const starterKit = useBudgetStore((s) => s.starterKit);

  const isLoading = status === "loading";

  const generateKit = useCallback(
    (payload?: GenerateStarterKitRequest) => budgetActions.generateKit(payload),
    []
  );

  const loadLatestKit = useCallback(() => budgetActions.loadLatestKit(), []);

  return {
    status,
    error,
    isLoading,
    starterKit,
    generateKit,
    loadLatestKit,
  };
};
