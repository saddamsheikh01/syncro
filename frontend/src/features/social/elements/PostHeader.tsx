import type { HTMLAttributes, ReactNode } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { cx } from "@/lib/classNames";

export interface PostHeaderProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  subtitle?: string;
  timeLabel?: string;
  avatarUrl?: string;
  matchScore?: number;
  rightSlot?: ReactNode;
  onProfileClick?: () => void;
}

export const PostHeader = ({
  className,
  name,
  subtitle,
  timeLabel,
  avatarUrl,
  matchScore,
  rightSlot,
  onProfileClick,
  ...props
}: PostHeaderProps) => (
  <div
    className={cx("flex flex-wrap items-center justify-between gap-4", className)}
    {...props}
  >
    {onProfileClick ? (
      <button
        type="button"
        onClick={onProfileClick}
        aria-label={`Open profile of ${name}`}
        className="group flex min-w-0 items-center gap-3 text-left"
      >
        <Avatar name={name} src={avatarUrl} />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-accent">
            {name}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
            {subtitle ? <span>{subtitle}</span> : null}
            {timeLabel ? <span>{timeLabel}</span> : null}
          </div>
        </div>
      </button>
    ) : (
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} src={avatarUrl} />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
            {subtitle ? <span>{subtitle}</span> : null}
            {timeLabel ? <span>{timeLabel}</span> : null}
          </div>
        </div>
      </div>
    )}
    <div className="flex items-center gap-2">
      {typeof matchScore === "number" ? (
        <MatchScoreBadge score={matchScore} showLabel={false} />
      ) : null}
      {rightSlot}
    </div>
  </div>
);
