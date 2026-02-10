"use client";

import { useMemo } from "react";
import { analyticsActions } from "../../stores/analytics/analyticsStore";
import { useAnalyticsStore } from "../../stores/analytics/useAnalyticsStore";

export const useAnalytics = () => {
  const state = useAnalyticsStore();

  const actions = useMemo(
    () => ({
      bootstrap: analyticsActions.bootstrap,
      trackEvent: analyticsActions.trackEvent,
      trackScreenViewed: analyticsActions.trackScreenViewed,
      markAppOpenedInSession: analyticsActions.markAppOpenedInSession,
      flushQueue: analyticsActions.flushQueue,
      clearLastEvent: analyticsActions.clearLastEvent,
    }),
    []
  );

  return {
    ...state,
    actions,
  };
};
