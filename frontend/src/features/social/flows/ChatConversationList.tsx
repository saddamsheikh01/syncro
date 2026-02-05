"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { ZyraChatRecap } from "@/features/zyra/cards/ZyraChatRecap";
import { useChat } from "@/hooks";
import { ChatListItem } from "../lists/ChatListItem";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import type { ChatConversationResponse } from "@/types/social";

const PAGE_SIZE = 20;

const formatTimeLabel = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) {
    return "Ieri";
  }
  if (diffDays < 7) {
    return date.toLocaleDateString("it-IT", { weekday: "short" });
  }
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
  });
};

const getOtherParticipantName = (
  conversation: ChatConversationResponse,
  currentUserId: string | null
): string => {
  if (!currentUserId) return "User";

  const other = conversation.participants.find(
    (p) => p.userId !== currentUserId
  );
  return other?.fullName ?? "User";
};

const getOtherParticipantAvatar = (
  conversation: ChatConversationResponse,
  currentUserId: string | null
): string | undefined => {
  if (!currentUserId) return undefined;

  const other = conversation.participants.find(
    (p) => p.userId !== currentUserId
  );
  return other?.avatarUrl ?? undefined;
};

const getOtherParticipantId = (
  conversation: ChatConversationResponse,
  currentUserId: string | null
): string | null => {
  if (!currentUserId) return null;
  const other = conversation.participants.find(
    (p) => p.userId !== currentUserId
  );
  return other?.userId ?? null;
};

export const ChatConversationList = () => {
  const router = useRouter();
  const { conversations, loadingConversations, error, actions } = useChat();
  const userId = useAuthStore((state) => state.user?.id ?? null);

  useEffect(() => {
    actions.fetchConversations({ size: PAGE_SIZE }).catch(() => undefined);
  }, [actions]);

  const handleRetry = useCallback(() => {
    actions.fetchConversations({ size: PAGE_SIZE }).catch(() => undefined);
  }, [actions]);

  const isLoading = loadingConversations && conversations.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Messages
        </p>
        <h1 className="text-3xl font-semibold text-foreground">Your chats</h1>
        <p className="text-sm text-muted">
          Chat with people you&apos;ve met.
        </p>
      </header>

      <ZyraChatRecap />

      {isLoading && (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Loading conversations...</p>
        </Card>
      )}

      {error && !isLoading && (
        <div className="space-y-3">
          <ErrorState
            title="Unable to load conversations"
            description={error.message}
          />
          <Button
            variant="secondary"
            onClick={handleRetry}
            disabled={loadingConversations}
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && conversations.length === 0 && (
        <EmptyState
          title="No conversations"
          description="Start a chat to see your conversations here."
          actionLabel="Discover people"
          actionHref="/matches"
        />
      )}

      {conversations.length > 0 && (
        <div className="flex flex-col gap-3">
          {conversations.map((conversation) => {
            const name = getOtherParticipantName(conversation, userId);
            const avatarUrl = getOtherParticipantAvatar(conversation, userId);
            const otherId = getOtherParticipantId(conversation, userId);
            const lastMessage = conversation.lastMessage;
            const messagePreview = lastMessage?.content ?? "No messages";
            const timeLabel = lastMessage
              ? formatTimeLabel(lastMessage.createdAt)
              : formatTimeLabel(conversation.createdAt);

            return (
              <ChatListItem
                key={conversation.id}
                name={name}
                messagePreview={messagePreview}
                timeLabel={timeLabel}
                avatarUrl={avatarUrl}
                href={`/chat/${conversation.id}`}
                onProfileClick={
                  otherId ? () => router.push(`/profile/${otherId}`) : undefined
                }
              />
            );
          })}
        </div>
      )}

      {conversations.length > 0 && (
        <p className="text-center text-xs text-subtle">
          {conversations.length} conversazioni
        </p>
      )}
    </div>
  );
};
