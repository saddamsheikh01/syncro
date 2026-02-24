"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NotificationDetailModal } from "@/components/ui/NotificationDetailModal";
import { NavIcon } from "@/components/ui/NavIcon";
import { useNotifications, useT } from "@/hooks";
import { getRuntimeBcp47 } from "@/i18n/runtimeLocale";
import { cx } from "@/lib/classNames";
import type { UserNotificationResponse } from "@/types/notifications";

const formatNotificationDate = (isoDate: string) => {
  const parsedDate = new Date(isoDate);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return parsedDate.toLocaleString(getRuntimeBcp47(), {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const NotificationBell = () => {
  const { t } = useT();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    unreadOnly,
    hasMore,
    loading,
    refreshing,
    loadingMore,
    actions,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<UserNotificationResponse | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current || !(event.target instanceof Node)) return;
      if (!containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const unreadLabel = useMemo(
    () => (unreadCount > 99 ? "99+" : String(unreadCount)),
    [unreadCount]
  );

  const handleToggle = () => {
    if (!open) {
      actions
        .sync({ page: 0, size: 20, unreadOnly }, { silent: true })
        .catch(() => undefined);
    }
    setOpen((current) => !current);
  };

  const handleOpenNotification = (notification: UserNotificationResponse) => {
    if (!notification.readAt) {
      actions.markAsRead(notification.id).catch(() => undefined);
    }

    if (notification.type === "MESSAGE") {
      const conversationId =
        notification.conversationId ??
        (typeof notification.data?.conversationId === "string"
          ? notification.data.conversationId
          : null);

      if (conversationId) {
        setOpen(false);
        setSelectedNotification(null);
        router.push(`/chat/${conversationId}`);
        return;
      }
    }

    setSelectedNotification(notification);
    setOpen(false);
  };

  const handleMarkAllAsRead = () => {
    actions.markAllAsRead().catch(() => undefined);
  };

  const handleMarkSingleAsRead = (notificationId: string) => {
    actions.markAsRead(notificationId).catch(() => undefined);
  };

  const handleFilterChange = (nextUnreadOnly: boolean) => {
    if (nextUnreadOnly === unreadOnly) return;
    actions.setUnreadOnly(nextUnreadOnly, { silent: true }).catch(() => undefined);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={t("Notifications")}
        aria-expanded={open}
        onClick={handleToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface text-subtle shadow-sm transition hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
      >
        <NavIcon name="bell" className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-white">
            {unreadLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[360px] rounded-[var(--radius-lg)] border border-border/70 bg-card p-3 shadow-lg">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {t("Notifications")}
              </p>
              <p className="text-xs text-subtle">
                {t("Unread notifications: {count}", { count: unreadCount })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  actions
                    .sync({ page: 0, size: 20, unreadOnly }, { silent: true })
                    .catch(() => undefined)
                }
                className="rounded-full border border-border px-2 py-1 text-[11px] font-semibold text-subtle transition hover:text-foreground"
              >
                {t("Refresh")}
              </button>
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className={cx(
                  "rounded-full border border-border px-2 py-1 text-[11px] font-semibold transition",
                  unreadCount === 0
                    ? "cursor-not-allowed text-subtle/60"
                    : "text-subtle hover:text-foreground"
                )}
              >
                {t("Mark all as read")}
              </button>
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange(false)}
              className={cx(
                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                unreadOnly
                  ? "border-border text-subtle hover:text-foreground"
                  : "border-accent/30 bg-accent-soft text-accent"
              )}
            >
              {t("All")}
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange(true)}
              className={cx(
                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                unreadOnly
                  ? "border-accent/30 bg-accent-soft text-accent"
                  : "border-border text-subtle hover:text-foreground"
              )}
            >
              {t("Unread")}
            </button>
          </div>

          <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {loading && notifications.length === 0 ? (
              <p className="rounded-[var(--radius-md)] border border-border/60 bg-surface-muted/70 px-3 py-4 text-center text-sm text-subtle">
                {t("Loading notifications...")}
              </p>
            ) : null}

            {!loading && notifications.length === 0 ? (
              <p className="rounded-[var(--radius-md)] border border-border/60 bg-surface-muted/70 px-3 py-4 text-center text-sm text-subtle">
                {t("No notifications yet")}
              </p>
            ) : null}

            {notifications.map((notification) => {
              const unread = notification.readAt === null;
              return (
                <div
                  key={notification.id}
                  className={cx(
                    "rounded-[var(--radius-md)] border px-3 py-2 transition",
                    unread
                      ? "border-accent/30 bg-accent-soft/60"
                      : "border-border/70 bg-surface"
                  )}
                >
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(notification)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold text-foreground">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                        {notification.body?.trim() || t("Open the app to see details.")}
                      </p>
                    </button>

                    {unread ? (
                      <button
                        type="button"
                        onClick={() => handleMarkSingleAsRead(notification.id)}
                        className="shrink-0 rounded-full border border-border px-2 py-1 text-[11px] font-semibold text-subtle transition hover:text-foreground"
                      >
                        {t("Mark as read")}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-subtle">
                      {formatNotificationDate(notification.createdAt)}
                    </p>
                    {unread ? (
                      <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {notifications.length > 0 && hasMore ? (
            <button
              type="button"
              onClick={() => actions.loadMore({ silent: true }).catch(() => undefined)}
              disabled={loadingMore}
              className={cx(
                "mt-2 w-full rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-semibold transition",
                loadingMore
                  ? "cursor-not-allowed text-subtle/70"
                  : "text-subtle hover:text-foreground"
              )}
            >
              {loadingMore ? t("Loading...") : t("Load more")}
            </button>
          ) : null}

          {refreshing ? (
            <p className="mt-2 text-right text-[11px] text-subtle">{t("Updating")}</p>
          ) : null}
        </div>
      ) : null}
      <NotificationDetailModal
        open={selectedNotification !== null}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
};
