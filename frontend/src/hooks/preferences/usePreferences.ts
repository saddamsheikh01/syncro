"use client";

import { useMemo } from "react";
import { useUserStore } from "../../stores/user/useUserStore";
import { userActions } from "../../stores/user/userStore";

export const usePreferences = () => {
  const state = useUserStore();

  const actions = useMemo(
    () => ({
      fetchPreferences: userActions.fetchPreferences,
      savePreferences: userActions.savePreferences,
    }),
    []
  );

  return {
    preferences: state.preferences,
    loading: state.loading,
    error: state.error,
    actions,
  };
};
