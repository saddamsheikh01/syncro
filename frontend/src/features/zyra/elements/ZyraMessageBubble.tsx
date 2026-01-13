import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export type ZyraMessageRole = "zyra" | "user";

export interface ZyraMessageBubbleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  message: string;
  sender?: ZyraMessageRole;
  timestamp?: string;
  statusLabel?: string;
}

export const ZyraMessageBubble = ({
  className,
  message,
  sender = "zyra",
  timestamp,
  statusLabel,
  ...props
}: ZyraMessageBubbleProps) => {
  const isUser = sender === "user";

  return (
    <div
      className={cx(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    >
      <div
        className={cx(
          "max-w-[80%] space-y-2 rounded-[var(--radius-lg)] border px-4 py-3 text-sm shadow-sm",
          isUser
            ? "border-accent/20 bg-accent text-accent-contrast"
            : "border-border bg-card text-foreground"
        )}
      >
        <p>{message}</p>
        {timestamp || statusLabel ? (
          <div
            className={cx(
              "flex items-center justify-between text-[11px]",
              isUser ? "text-accent-contrast/80" : "text-subtle"
            )}
          >
            <span>{timestamp}</span>
            {statusLabel ? <span>{statusLabel}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
