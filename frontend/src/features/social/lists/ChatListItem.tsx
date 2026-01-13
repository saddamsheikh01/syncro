import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface ChatListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  name: string;
  messagePreview: string;
  timeLabel?: string;
  avatarUrl?: string;
  unreadCount?: number;
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
  href,
  onPress,
  ...props
}: ChatListItemProps) => {
  const card = (
    <Card className={cx("flex items-center gap-4 p-4", className)} {...props}>
      <Avatar name={name} src={avatarUrl} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          {timeLabel ? (
            <span className="text-xs text-subtle">{timeLabel}</span>
          ) : null}
        </div>
        <p className="text-xs text-muted truncate">{messagePreview}</p>
      </div>
      {unreadCount ? (
        <Badge tone="accent" size="sm">
          {unreadCount}
        </Badge>
      ) : null}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }

  if (onPress) {
    return (
      <button type="button" onClick={onPress} className="w-full text-left">
        {card}
      </button>
    );
  }

  return card;
};
