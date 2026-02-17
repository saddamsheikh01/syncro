"use client";

import { useMemo } from "react";
import { useUserStore } from "../../stores/user/useUserStore";
import { userActions } from "../../stores/user/userStore";
import { getAdminLanguage, updateAdminLanguage } from "../../services/admin";

const FALLBACK_LANGUAGE = "en";

export const useI18n = () => {
  const state = useUserStore();

  const actions = useMemo(
    () => ({
      setLanguage: userActions.setLanguage,
      syncLanguage: (language: string) =>
        userActions.updateUser({ language }),
      syncAdminLanguage: async (language: string) => {
        const response = await updateAdminLanguage({ language });
        userActions.setLanguage(response.language);
        return response;
      },
      fetchAdminLanguage: async () => {
        const response = await getAdminLanguage();
        userActions.setLanguage(response.language);
        return response;
      },
    }),
    []
  );

  return {
    ...state,
    language: state.language ?? FALLBACK_LANGUAGE,
    fallbackLanguage: FALLBACK_LANGUAGE,
    actions,
  };
};
