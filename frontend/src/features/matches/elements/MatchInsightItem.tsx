import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import type { BadgeTone } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";

export interface MatchInsightItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  tone?: BadgeTone;
}

export const MatchInsightItem = ({
  className,
  title,
  description,
  tone = "neutral",
  ...props
}: MatchInsightItemProps) => (
  <div className={cx("flex items-start gap-3", className)} {...props}>
    <Badge tone={tone} size="sm">
      {title}
    </Badge>
    {description ? (
      <p className="text-xs text-muted">{description}</p>
    ) : null}
  </div>
);
