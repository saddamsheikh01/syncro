"use client";

import { useMemo } from "react";
import { uiActions } from "../../stores/ui/uiStore";
import { useUiStore } from "../../stores/ui/useUiStore";

export const useUi = () => {
  const state = useUiStore();

  const actions = useMemo(
    () => ({
      pushToast: uiActions.pushToast,
      dismissToast: uiActions.dismissToast,
      clearToasts: uiActions.clearToasts,
      openModal: uiActions.openModal,
      closeModal: uiActions.closeModal,
    }),
    []
  );

  return {
    ...state,
    actions,
  };
};
