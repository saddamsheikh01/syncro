import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Button } from "@/components/buttons/Button";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { NavIcon } from "@/components/ui/NavIcon";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

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
  onProfileClick?: () => void;
  profileLabel?: string;
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
  onProfileClick,
  profileLabel,
  ...props
}: ChatHeaderProps) => {
  const { t } = useT();

  return (
    <div
      className={cx("flex items-center justify-between gap-3", className)}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label={t("Go back")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-muted"
          >
            <NavIcon name="chevron-left" className="h-5 w-5" />
          </button>
        ) : null}

      {onProfileClick ? (
        <button
          type="button"
          onClick={onProfileClick}
          aria-label={
            profileLabel ?? t("Open profile of {name}", { name })
          }
          className="flex min-w-0 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-[var(--radius-lg)]"
        >
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
                  <span>{t("Typing...")}</span>
                </span>
              ) : isOnline ? (
                <span className="text-xs text-success">{t("Online")}</span>
              ) : lastSeen ? (
                <span className="text-xs text-subtle">{lastSeen}</span>
              ) : subtitle ? (
                <span className="text-xs text-subtle">{subtitle}</span>
              ) : null}
            </div>
          </div>
        </button>
      ) : (
        <>
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
                  <span>{t("Typing...")}</span>
                </span>
              ) : isOnline ? (
                <span className="text-xs text-success">{t("Online")}</span>
              ) : lastSeen ? (
                <span className="text-xs text-subtle">{lastSeen}</span>
              ) : subtitle ? (
                <span className="text-xs text-subtle">{subtitle}</span>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>

    <div className="flex shrink-0 items-center gap-2">
      {typeof matchScore === "number" ? (
        <MatchScoreBadge score={matchScore} showLabel={false} />
      ) : null}
      {onInfoClick ? (
        <button
          type="button"
          onClick={onInfoClick}
          aria-label={t("Conversation info")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <NavIcon name="info" className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  </div>
  );
};
