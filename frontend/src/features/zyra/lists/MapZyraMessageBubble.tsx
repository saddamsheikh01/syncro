import { ZyraMessageBubble } from "@/features/zyra/elements/ZyraMessageBubble";
import type { ZyraMessageBubbleProps } from "@/features/zyra/elements/ZyraMessageBubble";
import { cx } from "@/lib/classNames";

export interface MapZyraMessageBubbleProps {
  className?: string;
  items: ZyraMessageBubbleProps[];
}

export const MapZyraMessageBubble = ({
  className,
  items,
}: MapZyraMessageBubbleProps) => (
  <div className={cx("space-y-3", className)}>
    {items.map((item, index) => (
      <ZyraMessageBubble key={`${item.sender ?? "zyra"}-${index}`} {...item} />
    ))}
  </div>
);
