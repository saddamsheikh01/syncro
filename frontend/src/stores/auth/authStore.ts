import type { ApiError } from "../../types/api";
import type {
  AuthResponse,
  GoogleAuthRequest,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserResponse,
} from "../../types/auth";
import { createStore } from "../utils/createStore";
import { readStorage, writeStorage } from "../utils/storage";
import { setAccessToken } from "../../services/axiosConfig";
import {
  getMe,
  login,
  loginWithGoogle,
  logout,
  refreshToken,
  register,
} from "../../services/auth";

export type AuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  user: UserResponse | null;
  tokens: TokenResponse | null;
  error: ApiError | null;
};

const TOKEN_STORAGE_KEY = "syncro.auth.tokens";
const USER_STORAGE_KEY = "syncro.auth.user";

const initialState: AuthState = {
  status: "idle",
  user: null,
  tokens: null,
  error: null,
};

export const authStore = createStore<AuthState>(initialState);

const applyAuthResponse = (payload: AuthResponse) => {
  authStore.setState({
    status: "authenticated",
    user: payload.user,
    tokens: payload.tokens,
    error: null,
  });

  setAccessToken(payload.tokens.accessToken);
  writeStorage(TOKEN_STORAGE_KEY, payload.tokens);
  writeStorage(USER_STORAGE_KEY, payload.user);
};

const applyTokens = (tokens: TokenResponse) => {
  authStore.setState({
    status: "authenticated",
    tokens,
    error: null,
  });

  setAccessToken(tokens.accessToken);
  writeStorage(TOKEN_STORAGE_KEY, tokens);
};

export const authActions = {
  hydrate: () => {
    const tokens = readStorage<TokenResponse | null>(TOKEN_STORAGE_KEY, null);
    const user = readStorage<UserResponse | null>(USER_STORAGE_KEY, null);

    if (tokens?.accessToken) {
      setAccessToken(tokens.accessToken);
    }

    authStore.setState({
      status: tokens ? "authenticated" : "unauthenticated",
      tokens,
      user,
      error: null,
    });
  },

  setUser: (user: UserResponse | null) => {
    authStore.setState({ user });
    writeStorage(USER_STORAGE_KEY, user);
  },

  clearSession: () => {
    setAccessToken(null);
    writeStorage(TOKEN_STORAGE_KEY, null);
    writeStorage(USER_STORAGE_KEY, null);

    authStore.setState({
      status: "unauthenticated",
      user: null,
      tokens: null,
      error: null,
    });
  },

  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    authStore.setState({ status: "loading", error: null });

    try {
      const response = await register(payload);
      applyAuthResponse(response);
      return response;
    } catch (error) {
      authStore.setState({ status: "unauthenticated", error: error as ApiError });
      throw error;
    }
  },

  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    authStore.setState({ status: "loading", error: null });

    try {
      const response = await login(payload);
      applyAuthResponse(response);
      return response;
    } catch (error) {
      authStore.setState({ status: "unauthenticated", error: error as ApiError });
      throw error;
    }
  },

  loginWithGoogle: async (payload: GoogleAuthRequest): Promise<AuthResponse> => {
    authStore.setState({ status: "loading", error: null });

    try {
      const response = await loginWithGoogle(payload);
      applyAuthResponse(response);
      return response;
    } catch (error) {
      authStore.setState({ status: "unauthenticated", error: error as ApiError });
      throw error;
    }
  },

  refresh: async (): Promise<TokenResponse> => {
    const currentTokens = authStore.getState().tokens;

    if (!currentTokens?.refreshToken) {
      const error: ApiError = {
        code: "UNKNOWN",
        status: 0,
        message: "Refresh token assente",
      };
      authStore.setState({ error });
      throw error;
    }

    try {
      const response = await refreshToken({
        refreshToken: currentTokens.refreshToken,
      });
      applyTokens(response);
      return response;
    } catch (error) {
      authStore.setState({ error: error as ApiError });
      throw error;
    }
  },

  fetchMe: async (): Promise<UserResponse> => {
    authStore.setState({ status: "loading", error: null });

    try {
      const user = await getMe();
      authStore.setState({ status: "authenticated", user, error: null });
      writeStorage(USER_STORAGE_KEY, user);
      return user;
    } catch (error) {
      authStore.setState({ status: "unauthenticated", error: error as ApiError });
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    authStore.setState({ status: "loading" });

    try {
      await logout();
    } catch (error) {
      authStore.setState({ error: error as ApiError });
    } finally {
      authActions.clearSession();
    }
  },
};
