import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";

export interface ChatListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  name: string;
  messagePreview: string;
  timeLabel?: string;
  avatarUrl?: string;
  unreadCount?: number;
  isOnline?: boolean;
  isTyping?: boolean;
  href?: string;
  onPress?: () => void;
}

export const ChatListItem = ({
  className,
  name,
  messagePreview,
  timeLabel,
  avatarUrl,
  unreadCount,
  isOnline,
  isTyping,
  href,
  onPress,
  ...props
}: ChatListItemProps) => {
  const hasUnread = typeof unreadCount === "number" && unreadCount > 0;

  const card = (
    <div
      className={cx(
        "group relative flex items-center gap-4 rounded-[var(--radius-xl)] border border-border/50 bg-surface p-4 transition-all duration-200",
        "hover:border-accent/30 hover:bg-surface-muted hover:shadow-md",
        hasUnread && "border-accent/20 bg-accent/[0.02]",
        className
      )}
      {...props}
    >
      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        <Avatar
          name={name}
          src={avatarUrl}
          size="lg"
          className="ring-2 ring-surface ring-offset-1 ring-offset-background"
        />
        {isOnline ? (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success ring-2 ring-surface">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cx(
              "truncate text-sm text-foreground",
              hasUnread ? "font-bold" : "font-semibold"
            )}
          >
            {name}
          </p>
          {timeLabel ? (
            <span
              className={cx(
                "shrink-0 text-[11px]",
                hasUnread ? "font-semibold text-accent" : "text-subtle"
              )}
            >
              {timeLabel}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2">
          {isTyping ? (
            <span className="flex items-center gap-1 text-xs text-accent">
              <span className="flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
              </span>
              <span>sta scrivendo...</span>
            </span>
          ) : (
            <p
              className={cx(
                "truncate text-xs",
                hasUnread ? "font-medium text-foreground" : "text-muted"
              )}
            >
              {messagePreview}
            </p>
          )}
        </div>
      </div>

      {/* Unread badge or chevron */}
      <div className="flex shrink-0 items-center gap-2">
        {hasUnread ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : (
          <NavIcon
            name="chevron-right"
            className="h-4 w-4 text-subtle opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-[var(--radius-xl)]">
        {card}
      </Link>
    );
  }

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-[var(--radius-xl)]"
      >
        {card}
      </button>
    );
  }

  return card;
};
