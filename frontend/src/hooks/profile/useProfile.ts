"use client";

import { useMemo } from "react";
import { useUserStore } from "../../stores/user/useUserStore";
import { userActions } from "../../stores/user/userStore";

export const useProfile = () => {
  const state = useUserStore();

  const actions = useMemo(
    () => ({
      fetchProfile: userActions.fetchProfile,
      saveProfile: userActions.saveProfile,
    }),
    []
  );

  return {
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    actions,
  };
};
