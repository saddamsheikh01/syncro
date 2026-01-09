import type { ApiError } from "../../types/api";
import type {
  ZyraChatResponse,
  ZyraMessageRequest,
  ZyraMessageResponse,
  ZyraSessionResponse,
  ZyraSuggestionRequest,
  ZyraSuggestionResponse,
} from "../../types/zyra";
import type { PageResponse, Uuid } from "../../types/shared";
import type { PageParams } from "../../services/zyra";
import {
  createSession,
  createSuggestion,
  getMessages,
  getSessions,
  getSuggestions,
  sendMessage,
} from "../../services/zyra";
import { createStore } from "../utils/createStore";

export type ZyraState = {
  sessions: ZyraSessionResponse[];
  messagesBySession: Record<Uuid, ZyraMessageResponse[]>;
  suggestions: ZyraSuggestionResponse[];
  activeSessionId: Uuid | null;
  loadingSessions: boolean;
  loadingMessages: boolean;
  loadingSuggestions: boolean;
  error: ApiError | null;
};

const initialState: ZyraState = {
  sessions: [],
  messagesBySession: {},
  suggestions: [],
  activeSessionId: null,
  loadingSessions: false,
  loadingMessages: false,
  loadingSuggestions: false,
  error: null,
};

export const zyraStore = createStore<ZyraState>(initialState);

const updateMessages = (
  sessionId: Uuid,
  messages: ZyraMessageResponse[],
  append: boolean
) => {
  zyraStore.setState((state) => ({
    messagesBySession: {
      ...state.messagesBySession,
      [sessionId]: append
        ? [...(state.messagesBySession[sessionId] ?? []), ...messages]
        : messages,
    },
  }));
};

const addSession = (session: ZyraSessionResponse) => {
  zyraStore.setState((state) => {
    const exists = state.sessions.some((item) => item.id === session.id);
    return {
      sessions: exists ? state.sessions : [session, ...state.sessions],
    };
  });
};

const appendChatMessages = (sessionId: Uuid, response: ZyraChatResponse) => {
  updateMessages(sessionId, [response.userMessage, response.assistantMessage], true);
};

const mapPage = (response: PageResponse<ZyraSessionResponse>) => response.content;

export const zyraActions = {
  setActiveSession: (sessionId: Uuid | null) => {
    zyraStore.setState({ activeSessionId: sessionId });
  },

  createSession: async (): Promise<ZyraSessionResponse> => {
    zyraStore.setState({ loadingSessions: true, error: null });

    try {
      const response = await createSession();
      addSession(response);
      zyraStore.setState({ loadingSessions: false, activeSessionId: response.id });
      return response;
    } catch (error) {
      zyraStore.setState({ loadingSessions: false, error: error as ApiError });
      throw error;
    }
  },

  fetchSessions: async (
    params: PageParams = {}
  ): Promise<ZyraSessionResponse[]> => {
    zyraStore.setState({ loadingSessions: true, error: null });

    try {
      const response = await getSessions(params);
      zyraStore.setState({
        sessions: mapPage(response),
        loadingSessions: false,
      });
      return response.content;
    } catch (error) {
      zyraStore.setState({ loadingSessions: false, error: error as ApiError });
      throw error;
    }
  },

  fetchMessages: async (
    sessionId: Uuid,
    params: PageParams = {},
    options: { append?: boolean } = {}
  ): Promise<ZyraMessageResponse[]> => {
    zyraStore.setState({ loadingMessages: true, error: null });

    try {
      const response = await getMessages(sessionId, params);
      updateMessages(sessionId, response.content, options.append ?? false);
      zyraStore.setState({ loadingMessages: false });
      return response.content;
    } catch (error) {
      zyraStore.setState({ loadingMessages: false, error: error as ApiError });
      throw error;
    }
  },

  sendMessage: async (
    sessionId: Uuid,
    payload: ZyraMessageRequest
  ): Promise<ZyraChatResponse> => {
    zyraStore.setState({ loadingMessages: true, error: null });

    try {
      const response = await sendMessage(sessionId, payload);
      appendChatMessages(sessionId, response);
      zyraStore.setState({ loadingMessages: false });
      return response;
    } catch (error) {
      zyraStore.setState({ loadingMessages: false, error: error as ApiError });
      throw error;
    }
  },

  fetchSuggestions: async (
    params: PageParams = {}
  ): Promise<ZyraSuggestionResponse[]> => {
    zyraStore.setState({ loadingSuggestions: true, error: null });

    try {
      const response = await getSuggestions(params);
      zyraStore.setState({
        suggestions: response.content,
        loadingSuggestions: false,
      });
      return response.content;
    } catch (error) {
      zyraStore.setState({ loadingSuggestions: false, error: error as ApiError });
      throw error;
    }
  },

  createSuggestion: async (
    payload: ZyraSuggestionRequest
  ): Promise<ZyraSuggestionResponse> => {
    zyraStore.setState({ loadingSuggestions: true, error: null });

    try {
      const response = await createSuggestion(payload);
      zyraStore.setState((state) => ({
        suggestions: [response, ...state.suggestions],
        loadingSuggestions: false,
      }));
      return response;
    } catch (error) {
      zyraStore.setState({ loadingSuggestions: false, error: error as ApiError });
      throw error;
    }
  },
};
