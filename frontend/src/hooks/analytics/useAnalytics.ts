"use client";

import { useMemo } from "react";
import { analyticsActions } from "../../stores/analytics/analyticsStore";
import { useAnalyticsStore } from "../../stores/analytics/useAnalyticsStore";

export const useAnalytics = () => {
  const state = useAnalyticsStore();

  const actions = useMemo(
    () => ({
      trackEvent: analyticsActions.trackEvent,
      clearLastEvent: analyticsActions.clearLastEvent,
    }),
    []
  );

  return {
    ...state,
    actions,
  };
};
