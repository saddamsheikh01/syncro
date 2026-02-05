"use client";

import { useMemo } from "react";
import { testsActions } from "../../stores/insights/insightsStore";
import { useTestsStore } from "../../stores/insights/useTestsStore";

export const useTests = () => {
  const state = useTestsStore();

  const actions = useMemo(
    () => ({
      fetchTests: testsActions.fetchTests,
      fetchTest: testsActions.fetchTest,
      submitTest: testsActions.submitTest,
      clearActiveTest: testsActions.clearActiveTest,
      fetchCompletedCount: testsActions.fetchCompletedCount,
      fetchUserCompletedCount: testsActions.fetchUserCompletedCount,
      resetSubmission: testsActions.resetSubmission,
      resetSubmissions: testsActions.resetSubmissions,
    }),
    []
  );

  return {
    ...state,
    actions,
  };
};
