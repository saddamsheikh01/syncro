"use client";

import { useMemo } from "react";
import { catalogActions } from "../../stores/catalog/catalogStore";
import { useCatalogStore } from "../../stores/catalog/useCatalogStore";

export const useCatalog = () => {
  const state = useCatalogStore();

  const actions = useMemo(
    () => ({
      setFilters: catalogActions.setFilters,
      fetchCategories: catalogActions.fetchCategories,
      fetchPlaces: catalogActions.fetchPlaces,
      fetchPlace: catalogActions.fetchPlace,
      fetchExperiences: catalogActions.fetchExperiences,
      fetchExperience: catalogActions.fetchExperience,
      clearDetails: catalogActions.clearDetails,
    }),
    []
  );

  const hasMorePlaces = state.placesPage.page + 1 < state.placesPage.totalPages;
  const hasMoreExperiences =
    state.experiencesPage.page + 1 < state.experiencesPage.totalPages;

  return {
    ...state,
    hasMorePlaces,
    hasMoreExperiences,
    actions,
  };
};
