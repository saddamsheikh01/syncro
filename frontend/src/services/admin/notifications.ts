import { apiClient } from "../axiosConfig";
import type {
  AdminCreateNotificationRequest,
  NotificationResponse,
} from "../../types/admin";

export const createCustomNotifications = async (
  payload: AdminCreateNotificationRequest
): Promise<NotificationResponse[]> => {
  const { data } = await apiClient.post<NotificationResponse[]>(
    "/admin/notifications",
    payload
  );
  return data;
};
