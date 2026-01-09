import { apiClient } from "../axiosConfig";
import type { AnalyticsEventRequest } from "../../types/analytics";

export const trackEvent = async (payload: AnalyticsEventRequest): Promise<void> => {
  await apiClient.post("/analytics/events", payload);
};
