import { apiClient } from "../axiosConfig";
import type {
  AnonymousSession,
  ActivationStateResponse,
  CityComparisonRequest,
  CityComparisonResponse,
  CityDetail,
  CityListItem,
  ComputeScoringRequest,
  ConvertSessionRequest,
  CreateSessionRequest,
  OnboardingResponse,
  OnboardingStatusResponse,
  PatchOnboardingRequest,
  SaveAnswerRequest,
  ScoringResultResponse,
  CityScoreResponse,
  SnapshotResponse,
  WaitingListRequest,
} from "../../types/expats";

// ─── Funnel Config ────────────────────────────────────────────────────────────

export const getFunnelConfig = async (
  configKey = "expats_landing_v1",
  language = "en"
): Promise<unknown> => {
  const { data } = await apiClient.get("/expats/funnel/config", {
    params: { configKey, language },
  });
  return data;
};

// ─── Anonymous Sessions ───────────────────────────────────────────────────────

export const createSession = async (
  payload: CreateSessionRequest
): Promise<AnonymousSession> => {
  const { data } = await apiClient.post<AnonymousSession>(
    "/expats/anonymous/sessions",
    payload
  );
  return data;
};

export const getSession = async (sessionId: string): Promise<AnonymousSession> => {
  const { data } = await apiClient.get<AnonymousSession>(
    `/expats/anonymous/sessions/${sessionId}`
  );
  return data;
};

export const saveAnswer = async (
  sessionId: string,
  payload: SaveAnswerRequest
): Promise<AnonymousSession> => {
  const { data } = await apiClient.patch<AnonymousSession>(
    `/expats/anonymous/sessions/${sessionId}`,
    payload
  );
  return data;
};

// ─── Conversion ───────────────────────────────────────────────────────────────

export const convertSession = async (
  payload: ConvertSessionRequest
): Promise<{ status: string }> => {
  const { data } = await apiClient.post<{ status: string }>(
    "/expats/anonymous/convert",
    payload
  );
  return data;
};

// ─── Relocation Onboarding ────────────────────────────────────────────────────

export const getOnboarding = async (): Promise<OnboardingResponse> => {
  const { data } = await apiClient.get<OnboardingResponse>("/relocation/onboarding");
  return data;
};

export const patchOnboarding = async (
  payload: PatchOnboardingRequest
): Promise<OnboardingResponse> => {
  const { data } = await apiClient.patch<OnboardingResponse>(
    "/relocation/onboarding",
    payload
  );
  return data;
};

export const getOnboardingStatus = async (): Promise<OnboardingStatusResponse> => {
  const { data } = await apiClient.get<OnboardingStatusResponse>(
    "/relocation/onboarding/status"
  );
  return data;
};

export const getActivationState = async (): Promise<ActivationStateResponse> => {
  const { data } = await apiClient.get<ActivationStateResponse>(
    "/relocation/activation-state"
  );
  return data;
};

// ─── Snapshots ────────────────────────────────────────────────────────────────

export const createSnapshot = async (): Promise<SnapshotResponse> => {
  const { data } = await apiClient.post<SnapshotResponse>(
    "/relocation/onboarding/snapshots"
  );
  return data;
};

export const getSnapshots = async (): Promise<SnapshotResponse[]> => {
  const { data } = await apiClient.get<SnapshotResponse[]>(
    "/relocation/onboarding/snapshots"
  );
  return data;
};

// ─── City Scoring ─────────────────────────────────────────────────────────────

export const computeScoring = async (
  payload: ComputeScoringRequest
): Promise<ScoringResultResponse> => {
  const { data } = await apiClient.post<ScoringResultResponse>(
    "/relocation/city-scoring/compute",
    payload
  );
  return data;
};

export const getScoringHistory = async (): Promise<CityScoreResponse[]> => {
  const { data } = await apiClient.get<CityScoreResponse[]>(
    "/relocation/city-scoring/history"
  );
  return data;
};

export const getLatestScores = async (
  snapshotId: string
): Promise<CityScoreResponse[]> => {
  const { data } = await apiClient.get<CityScoreResponse[]>(
    `/relocation/city-scoring/latest/${snapshotId}`
  );
  return data;
};

export const compareCities = async (
  payload: CityComparisonRequest
): Promise<CityComparisonResponse> => {
  const { data } = await apiClient.post<CityComparisonResponse>(
    "/relocation/city-scoring/compare",
    payload
  );
  return data;
};

// ─── City Catalog ─────────────────────────────────────────────────────────────

export const getCities = async (): Promise<CityListItem[]> => {
  const { data } = await apiClient.get<CityListItem[]>("/relocation/cities");
  return data;
};

export const getCityById = async (cityId: string): Promise<CityDetail> => {
  const { data } = await apiClient.get<CityDetail>(`/relocation/cities/${cityId}`);
  return data;
};

export const getCityBySlug = async (slug: string): Promise<CityDetail> => {
  const { data } = await apiClient.get<CityDetail>(`/relocation/cities/slug/${slug}`);
  return data;
};

// ─── Waiting List ─────────────────────────────────────────────────────────────

export const joinWaitingList = async (payload: WaitingListRequest): Promise<unknown> => {
  const { data } = await apiClient.post("/relocation/waiting-list", payload);
  return data;
};
