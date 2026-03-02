import { apiClient } from "../axiosConfig";
import type {
  AstrologyCalculationRequest,
  AstrologyCalculationResponse,
} from "../../types/astrology";

const ASTROLOGY_TIMEOUT_MS = 90_000;

/** Calculate birth chart only (no auth required). First call may take longer while ephemeris files download. */
export const calculateAstrology = async (
  payload: AstrologyCalculationRequest
): Promise<AstrologyCalculationResponse> => {
  const { data } = await apiClient.post<AstrologyCalculationResponse>(
    "/astrology/calculate",
    payload,
    { timeout: ASTROLOGY_TIMEOUT_MS }
  );
  return data;
};

/** Calculate birth chart and save to current user profile (JWT required). */
export const calculateAndSaveAstrology = async (
  payload: AstrologyCalculationRequest
): Promise<AstrologyCalculationResponse> => {
  const { data } = await apiClient.post<AstrologyCalculationResponse>(
    "/astrology/calculate-and-save",
    payload,
    { timeout: ASTROLOGY_TIMEOUT_MS }
  );
  return data;
};
