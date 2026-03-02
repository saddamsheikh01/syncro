"use client";

import { useMemo } from "react";
import { authActions } from "../../stores/auth/authStore";
import { useAuthStore } from "../../stores/auth/useAuthStore";

export const useAuth = () => {
  const state = useAuthStore();

  const actions = useMemo(
    () => ({
      hydrate: authActions.hydrate,
      login: authActions.login,
      loginWithGoogle: authActions.loginWithGoogle,
      register: authActions.register,
      verifyEmail: authActions.verifyEmail,
      verifyEmailChange: authActions.verifyEmailChange,
      resendVerificationOtp: authActions.resendVerificationOtp,
      resendEmailChangeOtp: authActions.resendEmailChangeOtp,
      refresh: authActions.refresh,
      fetchMe: authActions.fetchMe,
      logout: authActions.logout,
      clearSession: authActions.clearSession,
      setUser: authActions.setUser,
    }),
    []
  );

  return {
    ...state,
    isAuthenticated: state.status === "authenticated",
    actions,
  };
};
