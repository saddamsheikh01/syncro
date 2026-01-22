import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  ZyraChatResponse,
  ZyraMessageRequest,
  ZyraMessageResponse,
  ZyraProfileRecapResponse,
  ZyraSessionResponse,
  ZyraSuggestionRequest,
  ZyraSuggestionResponse,
} from "../../types/zyra";
import type { PageResponse, Uuid } from "../../types/shared";

export type PageParams = {
  page?: number;
  size?: number;
};

export const createSession = async (): Promise<ZyraSessionResponse> => {
  const { data } = await apiClient.post<ZyraSessionResponse>("/zyra/sessions");
  return data;
};

const CHAT_TIMEOUT_MS = 60000;

export const getSessions = async (
  params: PageParams = {}
): Promise<PageResponse<ZyraSessionResponse>> => {
  const { data } = await apiClient.get<PageResponse<ZyraSessionResponse>>(
    "/zyra/sessions",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getMessages = async (
  sessionId: Uuid,
  params: PageParams = {}
): Promise<PageResponse<ZyraMessageResponse>> => {
  const { data } = await apiClient.get<PageResponse<ZyraMessageResponse>>(
    `/zyra/sessions/${sessionId}/messages`,
    { params: buildQueryParams(params) }
  );
  return data;
};

export const sendMessage = async (
  sessionId: Uuid,
  payload: ZyraMessageRequest
): Promise<ZyraChatResponse> => {
  const { data } = await apiClient.post<ZyraChatResponse>(
    `/zyra/sessions/${sessionId}/messages`,
    payload,
    { timeout: CHAT_TIMEOUT_MS }
  );
  return data;
};

export const getSuggestions = async (
  params: PageParams = {}
): Promise<PageResponse<ZyraSuggestionResponse>> => {
  const { data } = await apiClient.get<PageResponse<ZyraSuggestionResponse>>(
    "/zyra/suggestions",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const createSuggestion = async (
  payload: ZyraSuggestionRequest
): Promise<ZyraSuggestionResponse> => {
  const { data } = await apiClient.post<ZyraSuggestionResponse>(
    "/zyra/suggestions",
    payload
  );
  return data;
};

export const getProfileRecap = async (): Promise<ZyraProfileRecapResponse> => {
  const { data } = await apiClient.get<ZyraProfileRecapResponse>(
    "/zyra/profile-recap",
    { timeout: CHAT_TIMEOUT_MS }
  );
  return data;
};
