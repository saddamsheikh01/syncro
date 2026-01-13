import type { HTMLAttributes, ReactNode } from "react";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { cx } from "@/lib/classNames";

export interface RecommendationRowProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
  children: ReactNode;
}

export const RecommendationRow = ({
  className,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onActionClick,
  children,
  ...props
}: RecommendationRowProps) => (
  <section className={cx("space-y-4", className)} {...props}>
    <SectionHeader
      title={title}
      subtitle={subtitle}
      actionLabel={actionLabel}
      actionHref={actionHref}
      onActionClick={onActionClick}
    />
    <div className="flex gap-4 overflow-x-auto pb-2">
      <div className="flex min-w-full flex-nowrap gap-4 sm:min-w-0">
        {children}
      </div>
    </div>
  </section>
);
