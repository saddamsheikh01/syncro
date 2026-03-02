"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { useChat, useT } from "@/hooks";
import { recordActivity } from "@/services/users";
import { useAuthStore } from "@/stores/auth/useAuthStore";
import { ChatHeader } from "../sections/ChatHeader";
import { MessageList } from "../sections/MessageList";
import { ChatComposer } from "../sections/ChatComposer";
import type { ChatConversationResponse } from "@/types/social";
import type { Uuid } from "@/types/shared";

const PAGE_SIZE = 50;

interface ChatDetailProps {
  conversationId: Uuid;
}

const resolveChatParticipantName = (
  fullName: string | null | undefined,
  userId: string | null,
  t: (key: string, v?: Record<string, string>) => string
): string => {
  const s = fullName?.trim();
  if (s && s.length > 0 && !/not found|non trovato|utente non trovato/i.test(s)) {
    return s;
  }
  return userId ? t("User {id}", { id: userId.slice(0, 8) }) : t("User");
};

const getOtherParticipant = (
  conversation: ChatConversationResponse | null,
  currentUserId: string | null,
  t: (key: string, v?: Record<string, string>) => string
) => {
  if (!conversation || !currentUserId) {
    return { userId: null, name: t("User"), avatarUrl: undefined, profileIncomplete: false };
  }

  const other = conversation.participants.find(
    (p) => p.userId !== currentUserId
  );

  return {
    userId: other?.userId ?? null,
    name: resolveChatParticipantName(other?.fullName ?? null, other?.userId ?? null, t),
    avatarUrl: other?.avatarUrl ?? undefined,
    profileIncomplete: other?.profileIncomplete ?? false,
  };
};

export const ChatDetail = ({ conversationId }: ChatDetailProps) => {
  const router = useRouter();
  const { t } = useT();
  const {
    conversations,
    messagesByConversation,
    loadingMessages,
    sendingMessage,
    error,
    actions,
  } = useChat();
  const userId = useAuthStore((state) => state.user?.id ?? null);

  const [initialLoading, setInitialLoading] = useState(true);

  const conversation = conversations.find((c) => c.id === conversationId) ?? null;
  const messages = messagesByConversation[conversationId] ?? [];
  const otherParticipant = getOtherParticipant(conversation, userId, t);

  useEffect(() => {
    actions.setActiveConversation(conversationId);
    recordActivity().catch(() => undefined);
    return () => {
      actions.setActiveConversation(null);
    };
  }, [actions, conversationId]);

  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        if (conversations.length === 0) {
          await actions.fetchConversations({ size: 100 });
        }
        await actions.fetchMessages(conversationId, { size: PAGE_SIZE });
      } catch {
        // Gestito dallo store
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [actions, conversationId, conversations.length]);

  const handleSend = useCallback(
    async (content: string) => {
      try {
        await actions.sendMessage(conversationId, { content });
      } catch {
        // Gestito dallo store
      }
    },
    [actions, conversationId]
  );

  const handleBack = useCallback(() => {
    router.push("/chat");
  }, [router]);

  const handleRetry = useCallback(() => {
    actions.fetchMessages(conversationId, { size: PAGE_SIZE }).catch(() => undefined);
  }, [actions, conversationId]);

  const handleProfileOpen = useCallback(() => {
    if (!otherParticipant.userId) return;
    router.push(`/profile/${otherParticipant.userId}`);
  }, [otherParticipant.userId, router]);

  if (initialLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/70 bg-card px-4 py-3">
          <ChatHeader
            name={t("Loading...")}
            showBack
            onBack={handleBack}
          />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader size="md" />
            <p className="text-sm text-muted">{t("Loading conversation...")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    const isConnectionRequired =
      error.message?.toLowerCase().includes("connection required") ?? false;
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/70 bg-card px-4 py-3">
          <ChatHeader
            name={otherParticipant.name}
            avatarUrl={otherParticipant.avatarUrl}
            showBack
            onBack={handleBack}
            onProfileClick={otherParticipant.userId ? handleProfileOpen : undefined}
          />
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <ErrorState
            title={t("Unable to load messages")}
            description={error.message}
          />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="secondary" onClick={handleRetry}>
              {t("Retry")}
            </Button>
            {isConnectionRequired && otherParticipant.userId && (
              <Button variant="primary" onClick={handleProfileOpen}>
                {t("Send connection request")}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="shrink-0 border-b border-border/70 bg-card px-4 py-3">
        <ChatHeader
          name={otherParticipant.name}
          avatarUrl={otherParticipant.avatarUrl}
          showBack
          onBack={handleBack}
          onProfileClick={otherParticipant.userId ? handleProfileOpen : undefined}
        />
        {otherParticipant.profileIncomplete && (
          <p className="mt-2 text-xs text-muted" role="status">
            {t("This user has not completed their profile yet.")}
          </p>
        )}
      </div>

      <MessageList
        messages={messages}
        currentUserId={userId ?? ""}
        loading={loadingMessages}
        className="min-h-0 flex-1"
      />

      <div className="shrink-0 border-t border-border/70 bg-card p-4">
        <ChatComposer
          onSend={handleSend}
          loading={sendingMessage}
          placeholder={t("Write to {name}...", { name: otherParticipant.name })}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </div>
  );
};
