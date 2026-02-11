import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  AdminReferralCodeResponse,
  AdminReferralDetailResponse,
  AdminReferralUsageResponse,
} from "../../types/admin";
import type { PageResponse } from "../../types/shared";

export type AdminReferralsParams = {
  page?: number;
  size?: number;
};

export const getReferralCodes = async (
  params: AdminReferralsParams = {}
): Promise<PageResponse<AdminReferralCodeResponse>> => {
  const { data } = await apiClient.get<PageResponse<AdminReferralCodeResponse>>(
    "/admin/referrals",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getReferralDetail = async (
  code: string
): Promise<AdminReferralDetailResponse> => {
  const { data } = await apiClient.get<AdminReferralDetailResponse>(
    `/admin/referrals/${encodeURIComponent(code)}`
  );
  return data;
};

export const getReferralUsages = async (
  code: string,
  params: AdminReferralsParams = {}
): Promise<PageResponse<AdminReferralUsageResponse>> => {
  const { data } = await apiClient.get<PageResponse<AdminReferralUsageResponse>>(
    `/admin/referrals/${encodeURIComponent(code)}/usages`,
    { params: buildQueryParams(params) }
  );
  return data;
};
