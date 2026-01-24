"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { useChat } from "@/hooks";
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

const getOtherParticipant = (
  conversation: ChatConversationResponse | null,
  currentUserId: string | null
) => {
  if (!conversation || !currentUserId) {
    return { userId: null, name: "Utente", avatarUrl: undefined };
  }

  const other = conversation.participants.find(
    (p) => p.userId !== currentUserId
  );

  return {
    userId: other?.userId ?? null,
    name: other?.fullName ?? "Utente",
    avatarUrl: other?.avatarUrl ?? undefined,
  };
};

export const ChatDetail = ({ conversationId }: ChatDetailProps) => {
  const router = useRouter();
  const {
    conversations,
    messagesByConversation,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    error,
    actions,
  } = useChat();
  const userId = useAuthStore((state) => state.user?.id ?? null);

  const [initialLoading, setInitialLoading] = useState(true);

  const conversation = conversations.find((c) => c.id === conversationId) ?? null;
  const messages = messagesByConversation[conversationId] ?? [];
  const otherParticipant = getOtherParticipant(conversation, userId);

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
        <div className="border-b border-border/60 bg-card px-4 py-3">
          <ChatHeader
            name="Caricamento..."
            showBack
            onBack={handleBack}
          />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader size="md" />
            <p className="text-sm text-muted">Caricamento conversazione...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border/60 bg-card px-4 py-3">
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
            title="Impossibile caricare i messaggi"
            description={error.message}
          />
          <Button variant="secondary" onClick={handleRetry}>
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="shrink-0 border-b border-border/60 bg-card px-4 py-3">
        <ChatHeader
          name={otherParticipant.name}
          avatarUrl={otherParticipant.avatarUrl}
          showBack
          onBack={handleBack}
          onProfileClick={otherParticipant.userId ? handleProfileOpen : undefined}
        />
      </div>

      <MessageList
        messages={messages}
        currentUserId={userId ?? ""}
        loading={loadingMessages}
        className="min-h-0 flex-1"
      />

      <div className="shrink-0 border-t border-border/60 bg-card p-4">
        <ChatComposer
          onSend={handleSend}
          loading={sendingMessage}
          placeholder={`Scrivi a ${otherParticipant.name}...`}
          className="border-0 bg-transparent p-0 shadow-none"
        />
      </div>
    </div>
  );
};
