import type { UserNotificationResponse } from "@/types/notifications";

type TFunction = (key: string, params?: Record<string, string>) => string;

function getActorDisplayName(
  data: UserNotificationResponse["data"],
  t: TFunction
): string {
  const name = data?.actorDisplayName;
  if (typeof name === "string" && name.trim().length > 0) {
    return name.trim();
  }
  return t("A user");
}

export function getNotificationDisplay(
  notification: UserNotificationResponse,
  t: TFunction
): { title: string; body: string } {
  const { type, title: storedTitle, body: storedBody, data } = notification;
  const actor = getActorDisplayName(data ?? null, t);

  switch (type) {
    case "MESSAGE":
      return {
        title: t("New message"),
        body: storedBody?.trim() ?? "",
      };
    case "CONNECTION_REQUEST_RECEIVED":
      return {
        title: t("New connection request"),
        body: t("{actor} sent you a connection request.", { actor }),
      };
    case "CONNECTION_REQUEST_ACCEPTED":
      return {
        title: t("Request accepted"),
        body: t("{actor} accepted your connection request.", { actor }),
      };
    case "CONNECTION_REQUEST_REJECTED":
      return {
        title: t("Request rejected"),
        body: t("{actor} rejected your connection request.", { actor }),
      };
    case "POST_LIKE":
      return {
        title: t("New like"),
        body: t("{actor} liked your post.", { actor }),
      };
    case "POST_COMMENT":
      return {
        title: t("New comment"),
        body: t("{actor} commented on your post.", { actor }),
      };
    default:
      return {
        title: storedTitle?.trim() || t("Notification"),
        body: storedBody?.trim() ?? "",
      };
  }
}
