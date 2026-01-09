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
  error: ApiError | null;
};

const initialState: ChatState = {
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  loadingConversations: false,
  loadingMessages: false,
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

const addConversation = (conversation: ChatConversationResponse) => {
  chatStore.setState((state) => {
    const exists = state.conversations.some((item) => item.id === conversation.id);
    return {
      conversations: exists
        ? state.conversations
        : [conversation, ...state.conversations],
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
        conversations: response.content,
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
    chatStore.setState({ loadingMessages: true, error: null });

    try {
      const message = await sendMessage(conversationId, payload);
      updateMessages(conversationId, [message], true);
      chatStore.setState({ loadingMessages: false });
      return message;
    } catch (error) {
      chatStore.setState({ loadingMessages: false, error: error as ApiError });
      throw error;
    }
  },
};
