"use client";

import { useMemo } from "react";
import { userActions } from "../../stores/user/userStore";
import { useUserStore } from "../../stores/user/useUserStore";

export const useUser = () => {
  const state = useUserStore();

  const actions = useMemo(
    () => ({
      hydrateLanguage: userActions.hydrateLanguage,
      setLanguage: userActions.setLanguage,
      fetchCurrentUser: userActions.fetchCurrentUser,
      updateUser: userActions.updateUser,
      fetchProfile: userActions.fetchProfile,
      saveProfile: userActions.saveProfile,
      fetchPreferences: userActions.fetchPreferences,
      savePreferences: userActions.savePreferences,
    }),
    []
  );

  return {
    ...state,
    hasProfile: Boolean(state.profile),
    hasPreferences: Boolean(state.preferences),
    actions,
  };
};
