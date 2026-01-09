"use client";

import { useMemo } from "react";
import { matchesActions } from "../../stores/matches/matchesStore";
import { useMatchesStore } from "../../stores/matches/useMatchesStore";

export const useMatches = () => {
  const state = useMatchesStore();

  const actions = useMemo(
    () => ({
      fetchUserMatches: matchesActions.fetchUserMatches,
      fetchRecommendations: matchesActions.fetchRecommendations,
    }),
    []
  );

  const hasMoreUserMatches =
    state.userMatchesPage.page + 1 < state.userMatchesPage.totalPages;
  const hasMoreRecommendations =
    state.recommendationsPage.page + 1 < state.recommendationsPage.totalPages;

  return {
    ...state,
    hasMoreUserMatches,
    hasMoreRecommendations,
    actions,
  };
};
