"use client";

import { useMemo } from "react";
import { useUserStore } from "../../stores/user/useUserStore";
import { userActions } from "../../stores/user/userStore";

const FALLBACK_LANGUAGE = "en";

export const useI18n = () => {
  const state = useUserStore();

  const actions = useMemo(
    () => ({
      setLanguage: userActions.setLanguage,
      syncLanguage: (language: string) =>
        userActions.updateUser({ language }),
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
