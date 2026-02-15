"use client";

import { useState, type HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { ImageLightbox } from "@/components/elements/ImageLightbox";
import { Tag } from "@/components/elements/Tag";
import { formatInterestLabel } from "@/lib/interestEmoji";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export interface ProfileSummaryCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  username?: string | null;
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
  username,
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
  const { t } = useT();
  const jobLabel = [jobTitle, companyName].filter(Boolean).join(" · ");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const normalizedName = name.trim().toLowerCase();
  const normalizedUsername = username?.trim().toLowerCase();
  const shouldShowUsername =
    Boolean(normalizedUsername) && normalizedUsername !== normalizedName;

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      {lightboxOpen && avatarUrl ? (
        <ImageLightbox
          src={avatarUrl}
          alt={name}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}

      {showIdentity ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => avatarUrl && setLightboxOpen(true)}
              className={cx(
                "flex-shrink-0 rounded-full transition-transform hover:scale-105",
                avatarUrl && "cursor-pointer"
              )}
              aria-label={t("View profile photo")}
              disabled={!avatarUrl}
            >
              <Avatar name={name} src={avatarUrl} size="2xl" />
            </button>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-base font-semibold text-foreground">{name}</p>
              {shouldShowUsername ? (
                <p className="text-xs text-subtle">@{normalizedUsername}</p>
              ) : null}
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
            <Tag key={tag}>{formatInterestLabel(tag)}</Tag>
          ))}
        </div>
      ) : null}
    </Card>
  );
};
