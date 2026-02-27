"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useNotifications, useT, useUi } from "@/hooks";
import { getNotifications } from "@/services/notifications";
import { getNotificationDisplay } from "@/utils/notificationDisplay";
import type { UserNotificationResponse } from "@/types/notifications";

const POLLING_INTERVAL_MS = 20_000;
const NOTIFICATIONS_PAGE_SIZE = 20;
const MAX_TOASTS_PER_POLL = 3;

export const NotificationsTracker = () => {
  const router = useRouter();
  const { status } = useAuth();
  const { t } = useT();
  const { actions: notificationsActions } = useNotifications();
  const { actions: uiActions } = useUi();
  const bootstrappedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (status !== "authenticated") {
      bootstrappedRef.current = false;
      seenIdsRef.current.clear();
      notificationsActions.clear();
      return;
    }

    let active = true;

    const sync = async () => {
      void notificationsActions
        .fetchUnreadCount({ silent: true, trackLoading: false })
        .catch(() => undefined);

      try {
        const response = await getNotifications({
          page: 0,
          size: NOTIFICATIONS_PAGE_SIZE,
        });

        if (!active) return;
        const notifications = response.content;

        const seenIds = seenIdsRef.current;
        if (!bootstrappedRef.current) {
          notifications.forEach((notification) => seenIds.add(notification.id));
          bootstrappedRef.current = true;
          return;
        }

        const newNotifications = notifications.filter(
          (notification) => !seenIds.has(notification.id)
        );

        notifications.forEach((notification) => seenIds.add(notification.id));

        if (newNotifications.length === 0) return;

        const recentNotifications = newNotifications
          .slice(0, MAX_TOASTS_PER_POLL)
          .reverse();

        recentNotifications.forEach((notification) => {
          const { title: displayTitle, body: displayBody } =
            getNotificationDisplay(notification, t);
          const conversationId =
            notification.type === "MESSAGE"
              ? notification.conversationId ??
                (typeof notification.data?.conversationId === "string"
                  ? notification.data.conversationId
                  : null)
              : null;

          uiActions.pushToast({
            title: displayTitle,
            message: displayBody || t("Open the app to see details."),
            tone: "info",
            durationMs: 5000,
            ...(conversationId
              ? {
                  onClick: () => {
                    router.push(`/chat/${conversationId}`);
                  },
                }
              : {}),
          });
        });
      } catch {
        // Error state is already handled by the store.
      }
    };

    void sync();
    const intervalId = window.setInterval(() => {
      void sync();
    }, POLLING_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [notificationsActions, router, status, t, uiActions]);

  return null;
};
