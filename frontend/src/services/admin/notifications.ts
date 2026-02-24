import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  AdminCreateNotificationRequest,
  AdminNotificationCampaignSortBy,
  AdminNotificationCampaignSortDirection,
  AdminNotificationCampaignStatsResponse,
  AdminNotificationCampaignSummaryResponse,
  AdminNotificationRecipientResponse,
  NotificationResponse,
} from "../../types/admin";
import type { PageResponse, Uuid } from "../../types/shared";

export type AdminNotificationRecipientsParams = {
  q?: string;
  page?: number;
  size?: number;
};

export type AdminNotificationCampaignsParams = {
  title?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sortBy?: AdminNotificationCampaignSortBy;
  direction?: AdminNotificationCampaignSortDirection;
};

export const createCustomNotifications = async (
  payload: AdminCreateNotificationRequest
): Promise<NotificationResponse[]> => {
  const { data } = await apiClient.post<NotificationResponse[]>(
    "/admin/notifications",
    payload
  );
  return data;
};

export const searchNotificationRecipients = async (
  params: AdminNotificationRecipientsParams
): Promise<PageResponse<AdminNotificationRecipientResponse>> => {
  const { data } = await apiClient.get<PageResponse<AdminNotificationRecipientResponse>>(
    "/admin/notifications/recipients/search",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getNotificationCampaignStats = async (
  campaignId: Uuid
): Promise<AdminNotificationCampaignStatsResponse> => {
  const { data } = await apiClient.get<AdminNotificationCampaignStatsResponse>(
    `/admin/notifications/campaigns/${campaignId}/stats`
  );
  return data;
};

export const getNotificationCampaignHistory = async (
  params: AdminNotificationCampaignsParams = {}
): Promise<PageResponse<AdminNotificationCampaignSummaryResponse>> => {
  const { data } = await apiClient.get<PageResponse<AdminNotificationCampaignSummaryResponse>>(
    "/admin/notifications/campaigns",
    { params: buildQueryParams(params) }
  );
  return data;
};
