"use client";

import { useMemo } from "react";
import { feedActions } from "../../stores/feed/feedStore";
import { useFeedStore } from "../../stores/feed/useFeedStore";

export const useFeed = () => {
  const state = useFeedStore();

  const actions = useMemo(
    () => ({
      setFilters: feedActions.setFilters,
      resetFeed: feedActions.resetFeed,
      fetchFeed: feedActions.fetchFeed,
      likePost: feedActions.likePost,
      unlikePost: feedActions.unlikePost,
      reactToPost: feedActions.reactToPost,
      removeReaction: feedActions.removeReaction,
      toggleFavorite: feedActions.toggleFavorite,
    }),
    []
  );

  const hasMore = state.page + 1 < state.totalPages;

  return {
    ...state,
    hasMore,
    actions,
  };
};
