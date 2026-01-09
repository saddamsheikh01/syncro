"use client";

import { useMemo } from "react";
import { chatActions } from "../../stores/chat/chatStore";
import { useChatStore } from "../../stores/chat/useChatStore";

export const useChat = () => {
  const state = useChatStore();

  const actions = useMemo(
    () => ({
      setActiveConversation: chatActions.setActiveConversation,
      fetchConversations: chatActions.fetchConversations,
      createConversation: chatActions.createConversation,
      fetchMessages: chatActions.fetchMessages,
      sendMessage: chatActions.sendMessage,
    }),
    []
  );

  const activeMessages = state.activeConversationId
    ? state.messagesByConversation[state.activeConversationId] ?? []
    : [];

  return {
    ...state,
    activeMessages,
    actions,
  };
};
