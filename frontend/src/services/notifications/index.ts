import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type { UserNotificationResponse, NotificationUnreadCountResponse } from "@/types/notifications";
import type { PageResponse, Uuid } from "@/types/shared";

export type NotificationsListParams = {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
};

export const getNotifications = async (
  params: NotificationsListParams = {}
): Promise<PageResponse<UserNotificationResponse>> => {
  const { data } = await apiClient.get<PageResponse<UserNotificationResponse>>(
    "/notifications",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getNotificationUnreadCount =
  async (): Promise<NotificationUnreadCountResponse> => {
    const { data } = await apiClient.get<NotificationUnreadCountResponse>(
      "/notifications/unread-count"
    );
    return data;
  };

export const markNotificationAsRead = async (
  notificationId: Uuid
): Promise<UserNotificationResponse> => {
  const { data } = await apiClient.patch<UserNotificationResponse>(
    `/notifications/${notificationId}/read`
  );
  return data;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.post("/notifications/read-all");
};
