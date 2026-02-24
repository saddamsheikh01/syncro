"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/elements/Avatar";
import { Button } from "@/components/buttons/Button";
import { useChat, useMatches, useT } from "@/hooks";
import { getConnectionStatusWith } from "@/services/social";
import { cx } from "@/lib/classNames";
import type { ConnectionStatus } from "@/types/social";

const SparkIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
  </svg>
);

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-success bg-success/10 border-success/30";
  if (score >= 65) return "text-accent bg-accent/10 border-accent/30";
  if (score >= 50) return "text-warning bg-warning/10 border-warning/30";
  return "text-muted bg-surface-muted border-border";
};

export const QuickMatchPreview = () => {
  const router = useRouter();
  const { t } = useT();
  const { userMatches, loadingUserMatches, actions } = useMatches();
  const { actions: chatActions } = useChat();
  const fetchedRef = useRef(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchUserMatches({ size: 1 }).catch(() => undefined);
  }, [actions]);

  const match = userMatches[0];

  useEffect(() => {
    if (!match?.userId) {
      const tid = setTimeout(() => setConnectionStatus(null), 0);
      return () => clearTimeout(tid);
    }
    const tid = setTimeout(() => setConnectionLoading(true), 0);
    let cancelled = false;
    getConnectionStatusWith(match.userId)
      .then((res) => {
        if (!cancelled) setConnectionStatus(res.status ?? null);
      })
      .catch(() => {
        if (!cancelled) setConnectionStatus(null);
      })
      .finally(() => {
        if (!cancelled) setConnectionLoading(false);
      });
    return () => {
      clearTimeout(tid);
      cancelled = true;
    };
  }, [match]);

  const handleMessage = useCallback(() => {
    if (!match?.userId) return;
    setMessageLoading(true);
    chatActions
      .createConversation({ otherUserId: match.userId })
      .then((conversation) => router.push(`/chat/${conversation.id}`))
      .catch(() => {})
      .finally(() => setMessageLoading(false));
  }, [match, chatActions, router]);

  if (loadingUserMatches && !match) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-surface-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!match) return null;

  const name =
    match.user?.fullName?.trim() ||
    t("User {shortId}", { shortId: match.userId.slice(0, 6) });
  const location = [match.user?.city, match.user?.country]
    .filter(Boolean)
    .join(", ");
  const score = Math.round(match.scoreTotal ?? 0);

  const profileHref = `/profile/${match.userId}`;

  const renderAction = () => {
    if (connectionLoading) {
      return (
        <Button size="sm" fullWidth disabled>
          {t("Connect")}
        </Button>
      );
    }
    if (connectionStatus === "ACCEPTED") {
      return (
        <Button
          size="sm"
          fullWidth
          onClick={handleMessage}
          loading={messageLoading}
          loadingText={t("Message")}
        >
          {t("Message")}
        </Button>
      );
    }
    if (connectionStatus === "PENDING") {
      return (
        <Button size="sm" fullWidth variant="secondary" disabled>
          {t("Request sent")}
        </Button>
      );
    }
    return (
      <Link href={profileHref} className="block">
        <Button size="sm" fullWidth>
          {t("Connect")}
        </Button>
      </Link>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">
          {t("Most aligned with you today")}
        </p>
        <Link
          href="/matches"
          className="text-[10px] font-medium text-accent hover:underline"
        >
          {t("View all")}
        </Link>
      </div>
      <div
        className={cx(
          "rounded-[var(--radius-xl)] border border-border/70 bg-card p-4 shadow-sm",
          "transition-all duration-300 hover:border-accent/30 hover:shadow-md"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-qa-match-gradient-start to-qa-match-gradient-end p-0.5">
            <Avatar
              name={name}
              src={match.user?.avatarUrl ?? undefined}
              size="md"
              className="border-2 border-white"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {name}
            </p>
            {location ? (
              <p className="truncate text-xs text-muted">{location}</p>
            ) : null}
          </div>
          <div
            className={cx(
              "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
              getScoreColor(score)
            )}
          >
            <SparkIcon />
            {score}%
          </div>
        </div>
        <div className="mt-3">{renderAction()}</div>
      </div>
    </div>
  );
};
