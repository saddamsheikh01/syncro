import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  AdminUserAnalyticsResponse,
  AdminUsersFeatureUsagePageResponse,
  AdminUsersFeatureUsageParams,
  AnalyticsKpiParams,
  AnalyticsKpiResponse,
} from "../../types/analytics";
import type { Uuid } from "../../types/shared";

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

export const getUsersFeatureUsage = async (
  params: AdminUsersFeatureUsageParams = {}
): Promise<AdminUsersFeatureUsagePageResponse> => {
  const { data } = await apiClient.get<AdminUsersFeatureUsagePageResponse>(
    "/admin/analytics/users",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getUserAnalytics = async (
  userId: Uuid,
  params: AnalyticsKpiParams = {}
): Promise<AdminUserAnalyticsResponse> => {
  const { data } = await apiClient.get<AdminUserAnalyticsResponse>(
    `/admin/analytics/users/${userId}`,
    { params: buildQueryParams(params) }
  );
  return data;
};
