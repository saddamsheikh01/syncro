import axios, { AxiosHeaders } from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getLocaleCookie } from "@/i18n/cookies";
import type { ApiError, ApiErrorResponse } from "../types/api";
import type { TokenResponse } from "../types/auth";

const DEFAULT_TIMEOUT_MS = 15000;

const normalizeBaseUrl = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }
  return `${trimmed}/api/v1`;
};

const resolveBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }

  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080"
  );
};

export const API_BASE_URL = resolveBaseUrl();

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

const TOKEN_STORAGE_KEY = "syncro.auth.tokens";

/** Read the raw stored token bundle from localStorage. */
const getStoredTokens = (): { accessToken?: string; refreshToken?: string } | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { accessToken?: string; refreshToken?: string };
  } catch {
    return null;
  }
};

/** Read only the access token from localStorage (used as hydration fallback). */
const getStoredAccessToken = (): string | null =>
  getStoredTokens()?.accessToken ?? null;

/** Persist new tokens to localStorage so the auth store stays in sync. */
const persistTokens = (tokens: TokenResponse) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // ignore storage errors
  }
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const setOnUnauthorized = (callback: (() => void) | null) => {
  onUnauthorized = callback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
});

const isApiErrorResponse = (data: unknown): data is ApiErrorResponse => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const record = data as Record<string, unknown>;
  return (
    typeof record.status === "number" &&
    typeof record.message === "string" &&
    typeof record.error === "string" &&
    typeof record.path === "string" &&
    typeof record.timestamp === "string"
  );
};

export const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const response = axiosError.response;

    if (response?.data && isApiErrorResponse(response.data)) {
      return {
        code: "HTTP_ERROR",
        status: response.data.status,
        message: response.data.message,
        error: response.data.error,
        path: response.data.path,
        timestamp: response.data.timestamp,
      };
    }

    if (!response) {
      return {
        code: axiosError.code === "ECONNABORTED" ? "TIMEOUT" : "NETWORK_ERROR",
        status: 0,
        message: "Network error",
      };
    }

    return {
      code: "HTTP_ERROR",
      status: response.status,
      message: axiosError.message || "HTTP error",
    };
  }

  return {
    code: "UNKNOWN",
    status: 0,
    message: "Unexpected error",
  };
};

// ─── Request interceptor ───────────────────────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers);

  // Use in-memory token first; fall back to localStorage if not yet hydrated
  const token = accessToken ?? getStoredAccessToken();
  if (token) {
    if (!accessToken) accessToken = token; // lazy-populate in-memory cache
    headers.set("Authorization", `Bearer ${token}`);
  }

  const locale = getLocaleCookie();
  if (locale && locale.trim()) {
    headers.set("Accept-Language", locale.trim());
  }

  config.headers = headers;
  return config;
});

// ─── Response interceptor with silent token refresh ───────────────────────

/**
 * Pending callbacks waiting for the in-flight refresh to complete.
 * Each entry is { resolve, reject } for a retried request.
 */
type RefreshQueueEntry = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: RefreshQueueEntry[] = [];

const drainQueue = (newToken: string | null, err: unknown = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (newToken) resolve(newToken);
    else reject(err);
  });
  refreshQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(normalizeApiError(error));
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;

    // Only intercept 401s that haven't been retried yet and aren't the refresh
    // endpoint itself (to avoid infinite loops).
    if (
      status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh"
    ) {
      originalRequest._retry = true;

      // If another request already triggered a refresh, queue this one.
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          const headers =
            originalRequest.headers instanceof AxiosHeaders
              ? originalRequest.headers
              : new AxiosHeaders(originalRequest.headers);
          headers.set("Authorization", `Bearer ${newToken}`);
          originalRequest.headers = headers;
          return apiClient(originalRequest);
        });
      }

      isRefreshing = true;
      const storedRefreshToken = getStoredTokens()?.refreshToken;

      if (!storedRefreshToken) {
        isRefreshing = false;
        drainQueue(null, error);
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(normalizeApiError(error));
      }

      try {
        // Use a raw axios call to avoid circular interceptor loops.
        const { data } = await axios.post<TokenResponse>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        // Persist and apply the new tokens.
        accessToken = data.accessToken;
        persistTokens(data);
        drainQueue(data.accessToken);

        const headers =
          originalRequest.headers instanceof AxiosHeaders
            ? originalRequest.headers
            : new AxiosHeaders(originalRequest.headers);
        headers.set("Authorization", `Bearer ${data.accessToken}`);
        originalRequest.headers = headers;

        return apiClient(originalRequest);
      } catch (refreshError) {
        accessToken = null;
        drainQueue(null, refreshError);
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(normalizeApiError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeApiError(error));
  }
);