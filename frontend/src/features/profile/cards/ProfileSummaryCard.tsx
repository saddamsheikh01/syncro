import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Tag } from "@/components/elements/Tag";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface ProfileSummaryCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  location?: string;
  jobTitle?: string;
  companyName?: string;
  bio?: string;
  avatarUrl?: string;
  matchScore?: number;
  tags?: string[];
  showIdentity?: boolean;
}

export const ProfileSummaryCard = ({
  className,
  name,
  location,
  jobTitle,
  companyName,
  bio,
  avatarUrl,
  matchScore,
  tags = [],
  showIdentity = true,
  ...props
}: ProfileSummaryCardProps) => {
  const jobLabel = [jobTitle, companyName].filter(Boolean).join(" · ");

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      {showIdentity ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={name} src={avatarUrl} size="lg" />
            <div className="min-w-0 space-y-1">
              <p className="truncate text-base font-semibold text-foreground">{name}</p>
              {location ? (
                <p className="text-xs text-subtle">{location}</p>
              ) : null}
              {jobLabel ? (
                <p className="text-xs text-subtle">{jobLabel}</p>
              ) : null}
            </div>
          </div>
          {typeof matchScore === "number" ? (
            <MatchScoreBadge score={matchScore} />
          ) : null}
        </div>
      ) : typeof matchScore === "number" ? (
        <div className="flex items-center justify-end">
          <MatchScoreBadge score={matchScore} />
        </div>
      ) : null}
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
};
