import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { cx } from "@/lib/classNames";

export interface ForYouSectionHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export const ForYouSectionHeader = ({
  className,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onActionClick,
  ...props
}: ForYouSectionHeaderProps) => (
  <div className={cx("space-y-2", className)} {...props}>
    <Badge tone="accent" size="sm">
      For you
    </Badge>
    <SectionHeader
      title={title}
      subtitle={subtitle}
      actionLabel={actionLabel}
      actionHref={actionHref}
      onActionClick={onActionClick}
    />
  </div>
);
