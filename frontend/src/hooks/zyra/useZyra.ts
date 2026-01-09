"use client";

import { useMemo } from "react";
import { zyraActions } from "../../stores/zyra/zyraStore";
import { useZyraStore } from "../../stores/zyra/useZyraStore";

export const useZyra = () => {
  const state = useZyraStore();

  const actions = useMemo(
    () => ({
      setActiveSession: zyraActions.setActiveSession,
      createSession: zyraActions.createSession,
      fetchSessions: zyraActions.fetchSessions,
      fetchMessages: zyraActions.fetchMessages,
      sendMessage: zyraActions.sendMessage,
      fetchSuggestions: zyraActions.fetchSuggestions,
      createSuggestion: zyraActions.createSuggestion,
    }),
    []
  );

  const activeMessages = state.activeSessionId
    ? state.messagesBySession[state.activeSessionId] ?? []
    : [];

  return {
    ...state,
    activeMessages,
    actions,
  };
};
