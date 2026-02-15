"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/elements/Avatar";
import { useAuth, useChat, useT } from "@/hooks";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import { getRuntimeBcp47 } from "@/i18n/runtimeLocale";

const ChatIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const RecentChatsCard = () => {
  const router = useRouter();
  const { t } = useT();
  const { user } = useAuth();
  const { conversations, loadingConversations, actions } = useChat();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchConversations({ page: 0, size: 3 }).catch(() => undefined);
  }, [actions]);

  const recentChats = conversations.slice(0, 3);

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffMinutes < 1) return t("now");
    if (diffMinutes < 60) return t("{count}m", { count: diffMinutes });
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return t("{count}h", { count: diffHours });
    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 7) return t("{count}d", { count: diffDays });
    return date.toLocaleDateString(getRuntimeBcp47(), {
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (loadingConversations && recentChats.length === 0) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border/70 bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">
            {t("Your latest conversations")}
          </p>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-[var(--radius-md)] p-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-surface-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-2.5 w-16 animate-pulse rounded bg-surface-muted" />
                <div className="h-2 w-24 animate-pulse rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentChats.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-xl)] border border-border/70 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ChatIcon />
          <span>{t("Your latest conversations")}</span>
        </div>
        <Link
          href="/chat"
          className="text-[10px] font-medium text-accent hover:underline"
        >
          {t("View all")}
        </Link>
      </div>

      <div className="space-y-1">
        {recentChats.map((conversation) => {
          const otherParticipant = conversation.participants?.find(
            (p) => p.userId !== user?.id
          );
          const otherParticipantId = otherParticipant?.userId ?? null;
          const name = otherParticipant?.fullName || t("User");
          const lastMessage = conversation.lastMessage?.content || t("No messages");
          const time = conversation.lastMessage?.createdAt
            ? formatTime(conversation.lastMessage.createdAt)
            : conversation.createdAt
            ? formatTime(conversation.createdAt)
            : "";

          return (
            <div
              key={conversation.id}
              role="button"
              tabIndex={0}
              aria-label={t("Open chat with {name}", { name })}
              className={cx(
                "group flex items-center gap-2.5 rounded-[var(--radius-md)] p-2 transition-colors",
                "hover:bg-surface-muted"
              )}
              onClick={() => router.push(`/chat?id=${conversation.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/chat?id=${conversation.id}`);
                }
              }}
            >
              <Avatar
                name={name}
                src={otherParticipant?.avatarUrl ?? undefined}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-foreground">
                    {name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-[10px] text-muted">{time}</span>
                    {otherParticipantId ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(`/profile/${otherParticipantId}`);
                        }}
                        aria-label={t("Open profile of {name}", { name })}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-border/70 text-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
                      >
                        <NavIcon name="user" className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="truncate text-[11px] text-muted">{lastMessage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
