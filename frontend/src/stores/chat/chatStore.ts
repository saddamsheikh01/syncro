import type { ApiError } from "../../types/api";
import type {
  ChatConversationResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  CreateConversationRequest,
} from "../../types/social";
import type { Uuid } from "../../types/shared";
import { createStore } from "../utils/createStore";
import {
  createConversation,
  getConversations,
  getMessages,
  sendMessage,
  type PageParams,
} from "../../services/social";

export type ChatState = {
  conversations: ChatConversationResponse[];
  messagesByConversation: Record<Uuid, ChatMessageResponse[]>;
  activeConversationId: Uuid | null;
  loadingConversations: boolean;
  loadingMessages: boolean;
  sendingMessage: boolean;
  error: ApiError | null;
};

const initialState: ChatState = {
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  loadingConversations: false,
  loadingMessages: false,
  sendingMessage: false,
  error: null,
};

export const chatStore = createStore<ChatState>(initialState);

const updateMessages = (
  conversationId: Uuid,
  messages: ChatMessageResponse[],
  append: boolean
) => {
  chatStore.setState((state) => ({
    messagesByConversation: {
      ...state.messagesByConversation,
      [conversationId]: append
        ? [...(state.messagesByConversation[conversationId] ?? []), ...messages]
        : messages,
    },
  }));
};

const getConversationSortKey = (conversation: ChatConversationResponse): number => {
  const lastMessageDate = conversation.lastMessage?.createdAt;
  const timestamp = lastMessageDate
    ? new Date(lastMessageDate).getTime()
    : new Date(conversation.createdAt).getTime();
  return timestamp;
};

const sortConversations = (
  conversations: ChatConversationResponse[]
): ChatConversationResponse[] => {
  return [...conversations].sort(
    (a, b) => getConversationSortKey(b) - getConversationSortKey(a)
  );
};

const addConversation = (conversation: ChatConversationResponse) => {
  chatStore.setState((state) => {
    const exists = state.conversations.some((item) => item.id === conversation.id);
    if (exists) return state;
    return {
      conversations: sortConversations([conversation, ...state.conversations]),
    };
  });
};

const updateConversationLastMessage = (
  conversationId: Uuid,
  message: ChatMessageResponse
) => {
  chatStore.setState((state) => {
    const updated = state.conversations.map((conv) =>
      conv.id === conversationId
        ? { ...conv, lastMessage: message }
        : conv
    );
    return {
      conversations: sortConversations(updated),
    };
  });
};

export const chatActions = {
  setActiveConversation: (conversationId: Uuid | null) => {
    chatStore.setState({ activeConversationId: conversationId });
  },

  fetchConversations: async (
    params: PageParams = {}
  ): Promise<ChatConversationResponse[]> => {
    chatStore.setState({ loadingConversations: true, error: null });

    try {
      const response = await getConversations(params);
      chatStore.setState({
        conversations: sortConversations(response.content),
        loadingConversations: false,
      });
      return response.content;
    } catch (error) {
      chatStore.setState({
        loadingConversations: false,
        error: error as ApiError,
      });
      throw error;
    }
  },

  createConversation: async (
    payload: CreateConversationRequest
  ): Promise<ChatConversationResponse> => {
    chatStore.setState({ loadingConversations: true, error: null });

    try {
      const conversation = await createConversation(payload);
      addConversation(conversation);
      chatStore.setState({
        loadingConversations: false,
        activeConversationId: conversation.id,
      });
      return conversation;
    } catch (error) {
      chatStore.setState({
        loadingConversations: false,
        error: error as ApiError,
      });
      throw error;
    }
  },

  fetchMessages: async (
    conversationId: Uuid,
    params: PageParams = {},
    options: { append?: boolean } = {}
  ): Promise<ChatMessageResponse[]> => {
    chatStore.setState({ loadingMessages: true, error: null });

    try {
      const response = await getMessages(conversationId, params);
      updateMessages(conversationId, response.content, options.append ?? false);
      chatStore.setState({ loadingMessages: false });
      return response.content;
    } catch (error) {
      chatStore.setState({ loadingMessages: false, error: error as ApiError });
      throw error;
    }
  },

  sendMessage: async (
    conversationId: Uuid,
    payload: ChatMessageRequest
  ): Promise<ChatMessageResponse> => {
    chatStore.setState({ sendingMessage: true, error: null });

    try {
      const message = await sendMessage(conversationId, payload);
      updateMessages(conversationId, [message], true);
      updateConversationLastMessage(conversationId, message);
      chatStore.setState({ sendingMessage: false });
      return message;
    } catch (error) {
      chatStore.setState({ sendingMessage: false, error: error as ApiError });
      throw error;
    }
  },
};
