"use client";

import { useMemo } from "react";
import { testsActions } from "../../stores/tests/testsStore";
import { useTestsStore } from "../../stores/tests/useTestsStore";

export const useTests = () => {
  const state = useTestsStore();

  const actions = useMemo(
    () => ({
      fetchTests: testsActions.fetchTests,
      fetchTest: testsActions.fetchTest,
      submitTest: testsActions.submitTest,
      clearActiveTest: testsActions.clearActiveTest,
    }),
    []
  );

  return {
    ...state,
    actions,
  };
};
