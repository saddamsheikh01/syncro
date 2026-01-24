"use client";

import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Avatar } from "@/components/elements/Avatar";
import { Button } from "@/components/buttons/Button";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
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
  profileHref?: string;
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
  profileHref,
  ...props
}: ZyraMatchOfDayCardProps) => (
  <div
    className={cx(
      "zyra-surface relative rounded-[var(--radius-lg)] border border-zyra-border p-6 shadow-md",
      className
    )}
    {...props}
  >
    <div className="relative space-y-5">
      {/* Zyra badge header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zyra-border/60 shadow-sm zyra-surface-soft">
          <ZyraMark size="xs" glow={false} />
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zyra-text">
          Match del giorno
        </span>
      </div>

      {/* User info */}
      <div className="flex items-start justify-between gap-4">
        {profileHref ? (
          <Link href={profileHref} className="group flex min-w-0 items-center gap-4">
            <div className="relative">
              <div className="rounded-full bg-gradient-to-br from-zyra-start to-zyra-end p-0.5">
                <Avatar
                  name={title}
                  src={avatarUrl}
                  size="lg"
                  className="border-2 border-zyra-border/70 text-zyra-text zyra-surface-soft"
                />
              </div>
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-lg font-semibold text-foreground transition-colors group-hover:text-zyra-text">
                {title}
              </p>
              {subtitle ? (
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative">
              <div className="rounded-full bg-gradient-to-br from-zyra-start to-zyra-end p-0.5">
                <Avatar
                  name={title}
                  src={avatarUrl}
                  size="lg"
                  className="border-2 border-zyra-border/70 text-zyra-text zyra-surface-soft"
                />
              </div>
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-lg font-semibold text-foreground">{title}</p>
              {subtitle ? (
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        )}
        {typeof matchScore === "number" ? (
          <MatchScoreBadge score={matchScore} />
        ) : null}
      </div>

      {/* Description */}
      {description ? (
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      ) : null}

      {/* Action button */}
      {actionHref ? (
        <Link href={actionHref} className="inline-flex">
          <Button
            size="md"
            className="bg-gradient-to-r from-zyra-start to-zyra-end text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-zyra-start/30"
          >
            {actionLabel}
          </Button>
        </Link>
      ) : (
        <Button
          size="md"
          className="bg-gradient-to-r from-zyra-start to-zyra-end text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-zyra-start/30"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  </div>
);
