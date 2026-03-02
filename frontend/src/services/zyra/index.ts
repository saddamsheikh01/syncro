import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  ZyraBirthChartInterpretationRequest,
  ZyraBirthChartInterpretationResponse,
  ZyraChatRecapResponse,
  ZyraChatResponse,
  ZyraMessageRequest,
  ZyraMessageResponse,
  ZyraPlaceRecapResponse,
  ZyraProfileRecapResponse,
  ZyraSessionResponse,
  ZyraSuggestionRequest,
  ZyraSuggestionResponse,
  ZyraTestRecapResponse,
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

export const deleteSession = async (sessionId: Uuid): Promise<void> => {
  await apiClient.delete(`/zyra/sessions/${sessionId}`);
};

export const deleteAllSessions = async (): Promise<void> => {
  await apiClient.delete("/zyra/sessions");
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

/** Viewer's language for recap (e.g. "en"). Always send so backend returns recap in viewer's language. */
const recapLanguageHeader = (language?: string | null) => ({
  "Accept-Language": language && language.trim() ? language.trim() : "en",
});

export const getProfileRecap = async (
  language?: string | null
): Promise<ZyraProfileRecapResponse> => {
  const { data } = await apiClient.get<ZyraProfileRecapResponse>(
    "/zyra/profile-recap",
    { timeout: CHAT_TIMEOUT_MS, headers: recapLanguageHeader(language) }
  );
  return data;
};

/** Force-regenerate profile recap (skips stored recap). Use when user clicks "Regenerate". */
export const regenerateProfileRecap = async (
  language?: string | null
): Promise<ZyraProfileRecapResponse> => {
  const { data } = await apiClient.post<ZyraProfileRecapResponse>(
    "/zyra/profile-recap/regenerate",
    {},
    { timeout: CHAT_TIMEOUT_MS, headers: recapLanguageHeader(language) }
  );
  return data;
};

export const getProfileRecapForUser = async (
  userId: Uuid,
  language?: string | null
): Promise<ZyraProfileRecapResponse> => {
  const { data } = await apiClient.get<ZyraProfileRecapResponse>(
    `/zyra/profile-recap/${userId}`,
    { timeout: CHAT_TIMEOUT_MS, headers: recapLanguageHeader(language) }
  );
  return data;
};

export const getPlaceRecap = async (
  placeId: Uuid
): Promise<ZyraPlaceRecapResponse> => {
  const { data } = await apiClient.get<ZyraPlaceRecapResponse>(
    `/zyra/place-recap/${placeId}`,
    { timeout: CHAT_TIMEOUT_MS }
  );
  return data;
};

export const getChatRecap = async (): Promise<ZyraChatRecapResponse> => {
  const { data } = await apiClient.get<ZyraChatRecapResponse>(
    "/zyra/chat-recap",
    { timeout: CHAT_TIMEOUT_MS }
  );
  return data;
};

export const getTestRecap = async (
  submissionId: Uuid
): Promise<ZyraTestRecapResponse> => {
  const { data } = await apiClient.get<ZyraTestRecapResponse>(
    `/zyra/test-recap/${submissionId}`,
    { timeout: CHAT_TIMEOUT_MS }
  );
  return data;
};
/** Ask Zyra to translate birth chart placements into human-readable sentences. No calculations; interpretation only. */
export const interpretBirthChart = async (
  payload: ZyraBirthChartInterpretationRequest,
  language?: string | null
): Promise<ZyraBirthChartInterpretationResponse> => {
  const { data } = await apiClient.post<ZyraBirthChartInterpretationResponse>(
    "/zyra/interpret-birth-chart",
    payload,
    { timeout: CHAT_TIMEOUT_MS, headers: recapLanguageHeader(language) }
  );
  return data;
};

