import type { ApiError } from "../../types/api";
import type {
  AdminAuthResponse,
  AdminLoginRequest,
  AdminRegisterRequest,
  AdminUserResponse,
} from "../../types/admin";
import type { TokenResponse } from "../../types/auth";
import {
  getAdminMe,
  loginAdmin,
  logoutAdmin,
  refreshAdminToken,
  registerAdmin,
} from "../../services/admin";
import { setAccessToken } from "../../services/axiosConfig";
import { createStore } from "../utils/createStore";
import { readStorage, writeStorage } from "../utils/storage";

export type AdminAuthStatus =
  | "idle"
  | "loading"
  | "authenticated"
  | "unauthenticated";

export type AdminAuthState = {
  status: AdminAuthStatus;
  admin: AdminUserResponse | null;
  tokens: TokenResponse | null;
  error: ApiError | null;
};

const TOKEN_STORAGE_KEY = "syncro.admin.tokens";
const ADMIN_STORAGE_KEY = "syncro.admin.user";

const initialState: AdminAuthState = {
  status: "idle",
  admin: null,
  tokens: null,
  error: null,
};

export const adminAuthStore = createStore<AdminAuthState>(initialState);

const applyAuthResponse = (payload: AdminAuthResponse) => {
  adminAuthStore.setState({
    status: "authenticated",
    admin: payload.admin,
    tokens: payload.tokens,
    error: null,
  });

  setAccessToken(payload.tokens.accessToken);
  writeStorage(TOKEN_STORAGE_KEY, payload.tokens);
  writeStorage(ADMIN_STORAGE_KEY, payload.admin);
};

const applyTokens = (tokens: TokenResponse) => {
  adminAuthStore.setState({
    status: "authenticated",
    tokens,
    error: null,
  });

  setAccessToken(tokens.accessToken);
  writeStorage(TOKEN_STORAGE_KEY, tokens);
};

export const adminAuthActions = {
  hydrate: () => {
    const tokens = readStorage<TokenResponse | null>(TOKEN_STORAGE_KEY, null);
    const admin = readStorage<AdminUserResponse | null>(ADMIN_STORAGE_KEY, null);

    if (tokens?.accessToken) {
      setAccessToken(tokens.accessToken);
    }

    adminAuthStore.setState({
      status: tokens ? "authenticated" : "unauthenticated",
      tokens,
      admin,
      error: null,
    });
  },

  setAdmin: (admin: AdminUserResponse | null) => {
    adminAuthStore.setState({ admin });
    writeStorage(ADMIN_STORAGE_KEY, admin);
  },

  clearSession: () => {
    setAccessToken(null);
    writeStorage(TOKEN_STORAGE_KEY, null);
    writeStorage(ADMIN_STORAGE_KEY, null);

    adminAuthStore.setState({
      status: "unauthenticated",
      admin: null,
      tokens: null,
      error: null,
    });
  },

  login: async (payload: AdminLoginRequest): Promise<AdminAuthResponse> => {
    adminAuthStore.setState({ status: "loading", error: null });

    try {
      const response = await loginAdmin(payload);
      applyAuthResponse(response);
      return response;
    } catch (error) {
      adminAuthStore.setState({
        status: "unauthenticated",
        error: error as ApiError,
      });
      throw error;
    }
  },

  register: async (
    payload: AdminRegisterRequest,
    bootstrapSecret?: string
  ): Promise<AdminAuthResponse> => {
    adminAuthStore.setState({ status: "loading", error: null });

    try {
      const response = await registerAdmin(payload, bootstrapSecret);
      applyAuthResponse(response);
      return response;
    } catch (error) {
      adminAuthStore.setState({
        status: "unauthenticated",
        error: error as ApiError,
      });
      throw error;
    }
  },

  refresh: async (): Promise<TokenResponse> => {
    const currentTokens = adminAuthStore.getState().tokens;

    if (!currentTokens?.refreshToken) {
      const error: ApiError = {
        code: "UNKNOWN",
        status: 0,
        message: "Refresh token admin assente",
      };
      adminAuthStore.setState({ error });
      throw error;
    }

    try {
      const response = await refreshAdminToken({
        refreshToken: currentTokens.refreshToken,
      });
      applyTokens(response);
      return response;
    } catch (error) {
      adminAuthStore.setState({ error: error as ApiError });
      throw error;
    }
  },

  fetchMe: async (): Promise<AdminUserResponse> => {
    adminAuthStore.setState({ status: "loading", error: null });

    try {
      const admin = await getAdminMe();
      adminAuthStore.setState({ status: "authenticated", admin, error: null });
      writeStorage(ADMIN_STORAGE_KEY, admin);
      return admin;
    } catch (error) {
      adminAuthStore.setState({
        status: "unauthenticated",
        error: error as ApiError,
      });
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    adminAuthStore.setState({ status: "loading" });

    try {
      await logoutAdmin();
    } catch (error) {
      adminAuthStore.setState({ error: error as ApiError });
    } finally {
      adminAuthActions.clearSession();
    }
  },
};
