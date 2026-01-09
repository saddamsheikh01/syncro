"use client";

import { useMemo } from "react";
import { adminAuthActions } from "../../stores/admin/adminAuthStore";
import { useAdminAuthStore } from "../../stores/admin/useAdminAuthStore";

export const useAdminAuth = () => {
  const state = useAdminAuthStore();

  const actions = useMemo(
    () => ({
      hydrate: adminAuthActions.hydrate,
      login: adminAuthActions.login,
      register: adminAuthActions.register,
      refresh: adminAuthActions.refresh,
      fetchMe: adminAuthActions.fetchMe,
      logout: adminAuthActions.logout,
      clearSession: adminAuthActions.clearSession,
      setAdmin: adminAuthActions.setAdmin,
    }),
    []
  );

  return {
    ...state,
    isAuthenticated: state.status === "authenticated",
    actions,
  };
};
