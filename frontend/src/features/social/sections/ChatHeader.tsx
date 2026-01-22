import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Button } from "@/components/buttons/Button";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { NavIcon } from "@/components/ui/NavIcon";
import { cx } from "@/lib/classNames";

export interface ChatHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  name: string;
  subtitle?: string;
  isOnline?: boolean;
  isTyping?: boolean;
  lastSeen?: string;
  avatarUrl?: string;
  matchScore?: number;
  showBack?: boolean;
  onBack?: () => void;
  onInfoClick?: () => void;
}

export const ChatHeader = ({
  className,
  name,
  subtitle,
  isOnline,
  isTyping,
  lastSeen,
  avatarUrl,
  matchScore,
  showBack = false,
  onBack,
  onInfoClick,
  ...props
}: ChatHeaderProps) => (
  <div
    className={cx("flex items-center justify-between gap-3", className)}
    {...props}
  >
    <div className="flex min-w-0 items-center gap-3">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Torna indietro"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-muted"
        >
          <NavIcon name="chevron-left" className="h-5 w-5" />
        </button>
      ) : null}

      <div className="relative shrink-0">
        <Avatar name={name} src={avatarUrl} size="md" />
        {isOnline ? (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success ring-2 ring-card">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-foreground">{name}</p>
        <div className="flex items-center gap-1.5">
          {isTyping ? (
            <span className="flex items-center gap-1 text-xs text-accent">
              <span className="flex gap-0.5">
                <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:-0.3s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-accent [animation-delay:-0.15s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-accent" />
              </span>
              <span>sta scrivendo</span>
            </span>
          ) : isOnline ? (
            <span className="text-xs text-success">Online</span>
          ) : lastSeen ? (
            <span className="text-xs text-subtle">{lastSeen}</span>
          ) : subtitle ? (
            <span className="text-xs text-subtle">{subtitle}</span>
          ) : null}
        </div>
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-2">
      {typeof matchScore === "number" ? (
        <MatchScoreBadge score={matchScore} showLabel={false} />
      ) : null}
      {onInfoClick ? (
        <button
          type="button"
          onClick={onInfoClick}
          aria-label="Info conversazione"
          className="flex h-9 w-9 items-center justify-center rounded-full text-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <NavIcon name="info" className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  </div>
);
