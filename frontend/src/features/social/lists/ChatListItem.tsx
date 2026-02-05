import Link from "next/link";
import type { HTMLAttributes, MouseEvent } from "react";
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
  onProfileClick?: () => void;
  profileLabel?: string;
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
  onProfileClick,
  profileLabel,
  ...props
}: ChatListItemProps) => {
  const hasUnread = typeof unreadCount === "number" && unreadCount > 0;
  const handleProfileClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onProfileClick?.();
  };

  const card = (
    <div
      className={cx(
        "group relative flex items-center gap-4 rounded-[var(--radius-xl)] border border-border/70 bg-card p-4 transition-all duration-200",
        "hover:border-accent/30 hover:bg-surface-muted/70 hover:shadow-md",
        hasUnread && "border-accent/30 bg-accent-soft/40",
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
        {onProfileClick ? (
          <button
            type="button"
            onClick={handleProfileClick}
            aria-label={profileLabel ?? `Open profile of ${name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <NavIcon name="user" className="h-4 w-4" />
          </button>
        ) : null}
        {hasUnread ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] px-1.5 text-[10px] font-bold text-white shadow-[0_6px_12px_var(--accent-glow)]">
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
      <Link href={href} className="block rounded-[var(--radius-xl)] outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:ring-offset-2">
        {card}
      </Link>
    );
  }

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        className="w-full rounded-[var(--radius-xl)] text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/20 focus-visible:ring-offset-2"
      >
        {card}
      </button>
    );
  }

  return card;
};
