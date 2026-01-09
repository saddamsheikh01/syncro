"use client";

import { useMemo } from "react";
import { favoritesActions } from "../../stores/favorites/favoritesStore";
import { useFavoritesStore } from "../../stores/favorites/useFavoritesStore";

export const useFavorites = () => {
  const state = useFavoritesStore();

  const actions = useMemo(
    () => ({
      setFilters: favoritesActions.setFilters,
      fetchFavorites: favoritesActions.fetchFavorites,
      addFavorite: favoritesActions.addFavorite,
      removeFavorite: favoritesActions.removeFavorite,
    }),
    []
  );

  const hasMore = state.pageInfo.page + 1 < state.pageInfo.totalPages;

  return {
    ...state,
    hasMore,
    actions,
  };
};
