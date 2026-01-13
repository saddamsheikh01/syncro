import type { HTMLAttributes } from "react";
import { EmptyState } from "@/components/elements/EmptyState";
import { cx } from "@/lib/classNames";

export interface AdminEmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export const AdminEmptyState = ({
  className,
  title,
  description,
  actionLabel,
  actionHref,
  ...props
}: AdminEmptyStateProps) => (
  <div className={cx("rounded-[var(--radius-lg)]", className)} {...props}>
    <EmptyState
      title={title}
      description={description}
      actionLabel={actionLabel}
      actionHref={actionHref}
    />
  </div>
);
