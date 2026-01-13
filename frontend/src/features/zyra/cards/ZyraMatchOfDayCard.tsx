import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Button } from "@/components/buttons/Button";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface ZyraMatchOfDayCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  description?: string;
  avatarUrl?: string;
  matchScore?: number;
  actionLabel?: string;
  actionHref?: string;
}

export const ZyraMatchOfDayCard = ({
  className,
  title,
  subtitle,
  description,
  avatarUrl,
  matchScore,
  actionLabel = "Apri",
  actionHref,
  ...props
}: ZyraMatchOfDayCardProps) => (
  <Card className={cx("space-y-4 p-5", className)} {...props}>
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={title} src={avatarUrl} />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-base font-semibold text-foreground">{title}</p>
          {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
        </div>
      </div>
      {typeof matchScore === "number" ? (
        <MatchScoreBadge score={matchScore} />
      ) : null}
    </div>
    {description ? <p className="text-sm text-muted">{description}</p> : null}
    {actionHref ? (
      <Link href={actionHref} className="inline-flex">
        <Button size="sm" variant="secondary">
          {actionLabel}
        </Button>
      </Link>
    ) : (
      <Button size="sm" variant="secondary">
        {actionLabel}
      </Button>
    )}
  </Card>
);
