"use client";

import { createPortal } from "react-dom";
import { useT } from "@/hooks";
import { getRuntimeBcp47 } from "@/i18n/runtimeLocale";
import type { UserNotificationResponse } from "@/types/notifications";
import { Modal } from "./Modal";

export interface NotificationDetailModalProps {
  open: boolean;
  notification: UserNotificationResponse | null;
  onClose: () => void;
}

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

export const NotificationDetailModal = ({
  open,
  notification,
  onClose,
}: NotificationDetailModalProps) => {
  const { t } = useT();

  const description = notification?.createdAt
    ? formatNotificationDate(notification.createdAt)
    : undefined;

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) {
    return null;
  }

  return createPortal(
    <Modal
      open={open}
      title={notification?.title ?? t("Notifications")}
      description={description}
      onClose={onClose}
      primaryAction={{
        label: t("Close"),
        onClick: onClose,
        variant: "primary",
      }}
    >
      <div className="space-y-4">
        <div className="min-h-[128px] rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/60 p-5">
          <p className="whitespace-pre-wrap text-[17px] leading-8 text-foreground">
            {notification?.body?.trim() || t("Open the app to see details.")}
          </p>
        </div>
      </div>
    </Modal>,
    portalTarget
  );
};
