"use client";

import { useEffect, useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import type { ToastTone } from "@/stores/ui/uiStore";
import { useT } from "@/hooks";

export interface NotificationToastProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
  onClose?: () => void;
  onClick?: () => void;
}

const TONE_CLASSES: Record<ToastTone, string> = {
  info: "border-accent/20 bg-accent-soft text-foreground",
  success: "border-success/20 bg-success/10 text-foreground",
  warning: "border-warning/20 bg-warning/15 text-foreground",
  error: "border-danger/20 bg-danger/10 text-foreground",
};

const TONE_DOT: Record<ToastTone, string> = {
  info: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-danger",
};

export const NotificationToast = ({
  className,
  title,
  message,
  tone = "info",
  durationMs,
  onClose,
  onClick,
  ...props
}: NotificationToastProps) => {
  const { t } = useT();
  const [closing, setClosing] = useState(false);
  const resolvedTitle = title ? t(title) : t("Notification");

  const handleClose = useMemo(
    () => () => {
      if (closing) return;
      setClosing(true);
      if (onClose) {
        window.setTimeout(() => onClose(), 220);
      }
    },
    [closing, onClose]
  );

  const handleClick = useMemo(
    () => () => {
      if (onClick) {
        onClick();
        handleClose();
      }
    },
    [onClick, handleClose]
  );

  useEffect(() => {
    if (!durationMs || !onClose) return undefined;
    const timeoutId = window.setTimeout(() => handleClose(), durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [durationMs, onClose, handleClose]);

  const motionClass = closing ? "notification-out" : "notification-in";

  const content = (
    <div className="flex items-start gap-3">
      <span className={cx("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", TONE_DOT[tone])} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">{resolvedTitle}</p>
        <p className="text-xs text-muted">{message}</p>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="text-xs font-semibold text-subtle hover:text-foreground"
          aria-label={t("Close")}
        >
          x
        </button>
      ) : null}
    </div>
  );

  return (
    <div
      className={cx(
        "pointer-events-auto w-full rounded-[var(--radius-lg)] border p-4 shadow-md backdrop-blur-xl",
        TONE_CLASSES[tone],
        motionClass,
        onClick && "cursor-pointer",
        className
      )}
      role={onClick ? "button" : "status"}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {content}
    </div>
  );
};
