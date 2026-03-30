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
  CreateBudgetSimulationRequest,
  BudgetSimulationResponse,
  CreateBudgetTrackingRequest,
  BudgetTrackingResponse,
  GenerateStarterKitRequest,
  StarterKitResponse,
  MicroTestNextResponse,
  MicroTestSubmitRequest,
  RiskSnapshotResponse,
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

/** In-memory cache so funnel navigation does not refetch the catalog on every step mount. */
let citiesListCache: { data: CityListItem[]; fetchedAt: number } | null = null;
const CITIES_LIST_TTL_MS = 5 * 60 * 1000;

export const getCities = async (): Promise<CityListItem[]> => {
  const now = Date.now();
  if (citiesListCache && now - citiesListCache.fetchedAt < CITIES_LIST_TTL_MS) {
    return citiesListCache.data;
  }
  const { data } = await apiClient.get<CityListItem[]>("/relocation/cities");
  citiesListCache = { data, fetchedAt: now };
  return data;
};

/** Call after admin mutations if the public catalog must refresh in the same session (optional). */
export const invalidateExpatsCitiesCache = () => {
  citiesListCache = null;
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

// ─── Sprint 2: Budget Simulation ─────────────────────────────────────────────

export const runBudgetSimulation = async (
  payload: CreateBudgetSimulationRequest
): Promise<BudgetSimulationResponse> => {
  const { data } = await apiClient.post<BudgetSimulationResponse>(
    "/relocation/budget/simulations",
    payload
  );
  return data;
};

export const getBudgetSimulations = async (): Promise<BudgetSimulationResponse[]> => {
  const { data } = await apiClient.get<BudgetSimulationResponse[]>(
    "/relocation/budget/simulations"
  );
  return data;
};

// ─── Sprint 2: Budget Tracking ───────────────────────────────────────────────

export const createBudgetTracking = async (
  payload: CreateBudgetTrackingRequest
): Promise<BudgetTrackingResponse> => {
  const { data } = await apiClient.post<BudgetTrackingResponse>(
    "/relocation/budget/tracking",
    payload
  );
  return data;
};

export const getBudgetTracking = async (): Promise<BudgetTrackingResponse[]> => {
  const { data } = await apiClient.get<BudgetTrackingResponse[]>(
    "/relocation/budget/tracking"
  );
  return data;
};

// ─── Sprint 2: Starter Kit ──────────────────────────────────────────────────

export const generateStarterKit = async (
  payload?: GenerateStarterKitRequest
): Promise<StarterKitResponse> => {
  const { data } = await apiClient.post<StarterKitResponse>(
    "/relocation/starter-kit/generate",
    payload ?? {}
  );
  return data;
};

export const getLatestStarterKit = async (): Promise<StarterKitResponse> => {
  const { data } = await apiClient.get<StarterKitResponse>(
    "/relocation/starter-kit/latest"
  );
  return data;
};

// ─── Sprint 2: Micro-test ───────────────────────────────────────────────────

export const getNextMicroTest = async (): Promise<MicroTestNextResponse> => {
  const { data } = await apiClient.get<MicroTestNextResponse>(
    "/relocation/micro-tests/next"
  );
  return data;
};

export const submitMicroTestBlock = async (
  assignmentId: string,
  payload: MicroTestSubmitRequest
): Promise<unknown> => {
  const { data } = await apiClient.post(
    `/relocation/micro-tests/${assignmentId}/submit`,
    payload
  );
  return data;
};

// ─── Sprint 2: Risk Indicators ──────────────────────────────────────────────

export const getRiskIndicators = async (): Promise<RiskSnapshotResponse> => {
  const { data } = await apiClient.get<RiskSnapshotResponse>(
    "/relocation/risk/indicators"
  );
  return data;
};
