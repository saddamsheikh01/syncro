import type { IsoDateTime, JsonObject, Uuid } from "../shared";

export type NotificationType =
  | "MESSAGE"
  | "POST_LIKE"
  | "POST_COMMENT"
  | "CUSTOM";

export type UserNotificationResponse = {
  id: Uuid;
  userId: Uuid;
  type: NotificationType;
  title: string;
  body: string | null;
  data: JsonObject | null;
  conversationId: Uuid | null;
  messageId: Uuid | null;
  createdByAdminId: Uuid | null;
  campaignId?: Uuid | null;
  createdAt: IsoDateTime;
  readAt: IsoDateTime | null;
};

export type NotificationUnreadCountResponse = {
  count: number;
};
