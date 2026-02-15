import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";
import { getRuntimeBcp47 } from "@/i18n/runtimeLocale";

export interface MessageBubbleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  content: string;
  createdAt: string;
  isOwn: boolean;
  status?: "sending" | "sent" | "delivered" | "read";
}

const formatTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString(getRuntimeBcp47(), {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CheckIcon = ({ double, filled }: { double?: boolean; filled?: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    className={cx("h-3.5 w-3.5", filled ? "text-accent-contrast" : "text-accent-contrast/60")}
  >
    {double ? (
      <>
        <path
          d="M1.5 8.5L5 12L10.5 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 8.5L9 12L14.5 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <path
        d="M3 8.5L6.5 12L13 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

export const MessageBubble = ({
  className,
  content,
  createdAt,
  isOwn,
  status = "sent",
  ...props
}: MessageBubbleProps) => (
  <div
    className={cx(
      "flex",
      isOwn ? "justify-end" : "justify-start",
      className
    )}
    {...props}
  >
    <div
      className={cx(
        "relative max-w-[75%] px-4 py-2.5 shadow-sm",
        isOwn
          ? "rounded-2xl rounded-br-md bg-gradient-to-br from-accent to-accent/90 text-accent-contrast"
          : "rounded-2xl rounded-bl-md border border-border/40 bg-surface text-foreground"
      )}
    >
      <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
        {content}
      </p>
      <div
        className={cx(
          "mt-1.5 flex items-center justify-end gap-1",
          isOwn ? "text-accent-contrast/70" : "text-subtle"
        )}
      >
        <span className="text-[10px]">{formatTime(createdAt)}</span>
        {isOwn ? (
          <span className="ml-0.5">
            {status === "sending" ? (
              <span className="h-3 w-3 animate-spin rounded-full border border-accent-contrast/30 border-t-accent-contrast/70" />
            ) : status === "read" ? (
              <CheckIcon double filled />
            ) : status === "delivered" ? (
              <CheckIcon double />
            ) : (
              <CheckIcon />
            )}
          </span>
        ) : null}
      </div>
    </div>
  </div>
);
