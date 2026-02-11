import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type { AnalyticsKpiParams, AnalyticsKpiResponse } from "../../types/analytics";

export const getKpis = async (
  params: AnalyticsKpiParams = {}
): Promise<AnalyticsKpiResponse> => {
  const { data } = await apiClient.get<AnalyticsKpiResponse>(
    "/admin/analytics",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const refreshKpis = async (
  params: AnalyticsKpiParams = {}
): Promise<void> => {
  await apiClient.post("/admin/analytics/refresh", null, {
    params: buildQueryParams(params),
  });
};
