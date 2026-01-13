import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface TestListItemProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  title: string;
  description?: string;
  questionCount?: number;
  estimatedMinutes?: number;
  statusLabel?: string;
  href?: string;
  onPress?: () => void;
  actionLabel?: string;
}

export const TestListItem = ({
  className,
  title,
  description,
  questionCount,
  estimatedMinutes,
  statusLabel,
  href,
  onPress,
  actionLabel = "Inizia",
  ...props
}: TestListItemProps) => {
  const content = (
    <Card className={cx("flex flex-col gap-4 p-4", className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-foreground">{title}</h4>
          {description ? (
            <p className="text-xs text-muted">{description}</p>
          ) : null}
        </div>
        {statusLabel ? <Badge tone="accent">{statusLabel}</Badge> : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-subtle">
          {typeof questionCount === "number" ? (
            <span>{questionCount} domande</span>
          ) : null}
          {typeof estimatedMinutes === "number" ? (
            <span>{estimatedMinutes} min</span>
          ) : null}
        </div>
        <Button size="sm" variant="secondary">
          {actionLabel}
        </Button>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  if (onPress) {
    return (
      <button type="button" onClick={onPress} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
};
