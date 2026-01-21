"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Avatar } from "@/components/elements/Avatar";
import { useChat, useAuth } from "@/hooks";
import { cx } from "@/lib/classNames";

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

const formatTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Ora";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}g`;
  return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
};

export const RecentChatsCard = () => {
  const { user } = useAuth();
  const { conversations, loadingConversations, actions } = useChat();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchConversations({ page: 0, size: 3 }).catch(() => undefined);
  }, [actions]);

  const recentChats = conversations.slice(0, 3);

  if (loadingConversations && recentChats.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Chat recenti</p>
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ChatIcon />
          <span>Chat recenti</span>
        </div>
        <Link
          href="/chat"
          className="text-[10px] font-medium text-accent hover:underline"
        >
          Vedi tutte
        </Link>
      </div>

      <div className="space-y-1">
        {recentChats.map((conversation) => {
          const otherParticipant = conversation.participants?.find(
            (p) => p.userId !== user?.id
          );
          const name = otherParticipant?.fullName || "Utente";
          const lastMessage = conversation.lastMessage?.content || "Nessun messaggio";
          const time = conversation.lastMessage?.createdAt
            ? formatTime(conversation.lastMessage.createdAt)
            : conversation.createdAt
            ? formatTime(conversation.createdAt)
            : "";

          return (
            <Link
              key={conversation.id}
              href={`/chat?id=${conversation.id}`}
              className={cx(
                "group flex items-center gap-2.5 rounded-[var(--radius-md)] p-2 transition-colors",
                "hover:bg-surface-muted"
              )}
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
                  <span className="shrink-0 text-[10px] text-muted">{time}</span>
                </div>
                <p className="truncate text-[11px] text-muted">{lastMessage}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
