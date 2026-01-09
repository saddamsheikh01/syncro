import type { ApiError } from "../../types/api";
import type { AnalyticsEventRequest } from "../../types/analytics";
import { trackEvent } from "../../services/analytics";
import { createStore } from "../utils/createStore";

export type AnalyticsState = {
  lastEvent: AnalyticsEventRequest | null;
  loading: boolean;
  error: ApiError | null;
};

const initialState: AnalyticsState = {
  lastEvent: null,
  loading: false,
  error: null,
};

export const analyticsStore = createStore<AnalyticsState>(initialState);

export const analyticsActions = {
  trackEvent: async (payload: AnalyticsEventRequest): Promise<void> => {
    analyticsStore.setState({ loading: true, error: null });

    try {
      await trackEvent(payload);
      analyticsStore.setState({ loading: false, lastEvent: payload });
    } catch (error) {
      analyticsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  clearLastEvent: () => {
    analyticsStore.setState({ lastEvent: null });
  },
};
