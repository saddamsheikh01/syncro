"use client";

import { useMemo } from "react";
import { notificationsActions } from "../../stores/notifications/notificationsStore";
import { useNotificationsStore } from "../../stores/notifications/useNotificationsStore";

export const useNotifications = () => {
  const state = useNotificationsStore();

  const actions = useMemo(
    () => ({
      fetchNotifications: notificationsActions.fetchNotifications,
      fetchUnreadCount: notificationsActions.fetchUnreadCount,
      sync: notificationsActions.sync,
      setUnreadOnly: notificationsActions.setUnreadOnly,
      loadMore: notificationsActions.loadMore,
      markAsRead: notificationsActions.markAsRead,
      markAllAsRead: notificationsActions.markAllAsRead,
      clear: notificationsActions.clear,
    }),
    []
  );

  return {
    ...state,
    actions,
  };
};
