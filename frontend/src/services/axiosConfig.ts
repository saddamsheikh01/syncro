import axios, { AxiosHeaders } from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiError, ApiErrorResponse } from "../types/api";

const DEFAULT_TIMEOUT_MS = 15000;

const normalizeBaseUrl = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/api/v1")) {
    return trimmed;
  }
  return `${trimmed}/api/v1`;
};

export const API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8080"
);

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
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
        message: "Errore di rete",
      };
    }

    return {
      code: "HTTP_ERROR",
      status: response.status,
      message: axiosError.message || "Errore HTTP",
    };
  }

  return {
    code: "UNKNOWN",
    status: 0,
    message: "Errore inatteso",
  };
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    config.headers = headers;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error))
);
