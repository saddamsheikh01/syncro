import { apiClient } from "../axiosConfig";
import type { ReferralLinkResponse } from "../../types/referrals";

export const getMyReferralLink = async (): Promise<ReferralLinkResponse> => {
  const { data } = await apiClient.get<ReferralLinkResponse>("/referrals/me");
  return data;
};
