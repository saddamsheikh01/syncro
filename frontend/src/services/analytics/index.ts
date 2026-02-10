import { apiClient } from "../axiosConfig";
import type {
  AnalyticsBatchRequest,
  AnalyticsBatchResponse,
} from "../../types/analytics";

export const trackEventsBatch = async (
  payload: AnalyticsBatchRequest
): Promise<AnalyticsBatchResponse> => {
  const { data } = await apiClient.post<AnalyticsBatchResponse>(
    "/analytics/events/batch",
    payload
  );
  return data;
};
