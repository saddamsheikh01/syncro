import type { ChatListItemProps } from "./ChatListItem";
import { ChatListItem } from "./ChatListItem";
import { cx } from "@/lib/classNames";

export interface MapChatListItemProps {
  className?: string;
  items: ChatListItemProps[];
}

export const MapChatListItem = ({ className, items }: MapChatListItemProps) => (
  <div className={cx("grid gap-3", className)}>
    {items.map((item, index) => (
      <ChatListItem key={`${item.name}-${index}`} {...item} />
    ))}
  </div>
);
