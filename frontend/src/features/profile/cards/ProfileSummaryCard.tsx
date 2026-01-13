import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Tag } from "@/components/elements/Tag";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface ProfileSummaryCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  location?: string;
  bio?: string;
  avatarUrl?: string;
  matchScore?: number;
  tags?: string[];
}

export const ProfileSummaryCard = ({
  className,
  name,
  location,
  bio,
  avatarUrl,
  matchScore,
  tags = [],
  ...props
}: ProfileSummaryCardProps) => (
  <Card className={cx("space-y-4 p-5", className)} {...props}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} src={avatarUrl} size="lg" />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-base font-semibold text-foreground">{name}</p>
          {location ? (
            <p className="text-xs text-subtle">{location}</p>
          ) : null}
        </div>
      </div>
      {typeof matchScore === "number" ? (
        <MatchScoreBadge score={matchScore} />
      ) : null}
    </div>
    {bio ? <p className="text-sm text-muted">{bio}</p> : null}
    {tags.length ? (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    ) : null}
  </Card>
);
