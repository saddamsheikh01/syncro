import type { HTMLAttributes } from "react";
import { cx } from "@/lib/classNames";

export interface MessageBubbleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  content: string;
  createdAt: string;
  isOwn: boolean;
}

const formatTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  return date.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const MessageBubble = ({
  className,
  content,
  createdAt,
  isOwn,
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
        "max-w-[80%] rounded-[var(--radius-lg)] px-4 py-3",
        isOwn
          ? "bg-accent text-accent-contrast rounded-br-[var(--radius-sm)]"
          : "bg-surface-muted text-foreground rounded-bl-[var(--radius-sm)]"
      )}
    >
      <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
      <p
        className={cx(
          "mt-1 text-xs",
          isOwn ? "text-accent-contrast/70" : "text-subtle"
        )}
      >
        {formatTime(createdAt)}
      </p>
    </div>
  </div>
);
