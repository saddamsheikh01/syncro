import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/buttons/Button";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { cx } from "@/lib/classNames";

const BackIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export interface ChatHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  name: string;
  subtitle?: string;
  statusLabel?: string;
  lastSeen?: string;
  avatarUrl?: string;
  matchScore?: number;
  actionLabel?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const ChatHeader = ({
  className,
  name,
  subtitle,
  statusLabel,
  lastSeen,
  avatarUrl,
  matchScore,
  actionLabel,
  showBack = false,
  onBack,
  ...props
}: ChatHeaderProps) => (
  <div
    className={cx("flex flex-wrap items-center justify-between gap-4", className)}
    {...props}
  >
    <div className="flex min-w-0 items-center gap-3">
      {showBack ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={onBack}
          aria-label="Torna indietro"
          className="mr-1 shrink-0 p-2"
        >
          <BackIcon />
        </Button>
      ) : null}
      <Avatar name={name} src={avatarUrl} />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-semibold text-foreground">{name}</p>
          {statusLabel ? <Badge size="sm">{statusLabel}</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
          {subtitle ? <span>{subtitle}</span> : null}
          {lastSeen ? <span>{lastSeen}</span> : null}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {typeof matchScore === "number" ? (
        <MatchScoreBadge score={matchScore} showLabel={false} />
      ) : null}
      {actionLabel ? (
        <Button size="sm" variant="ghost">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  </div>
);
