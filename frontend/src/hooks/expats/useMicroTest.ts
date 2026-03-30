"use client";

import { useCallback } from "react";
import { useBudgetStore } from "../../stores/expats/useBudgetStore";
import { budgetActions } from "../../stores/expats/budgetStore";
import type { MicroTestSubmitRequest } from "../../types/expats";

export const useMicroTest = () => {
  const status = useBudgetStore((s) => s.status);
  const error = useBudgetStore((s) => s.error);
  const microTestNext = useBudgetStore((s) => s.microTestNext);

  const isLoading = status === "loading";

  const loadNextMicroTest = useCallback(() => budgetActions.loadNextMicroTest(), []);

  const submitMicroTest = useCallback(
    (assignmentId: string, payload: MicroTestSubmitRequest) =>
      budgetActions.submitMicroTest(assignmentId, payload),
    []
  );

  return {
    status,
    error,
    isLoading,
    microTestNext,
    loadNextMicroTest,
    submitMicroTest,
  };
};
