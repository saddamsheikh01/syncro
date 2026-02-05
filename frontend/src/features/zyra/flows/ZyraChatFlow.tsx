"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Textarea } from "@/components/elements/Textarea";
import { Modal } from "@/components/ui/Modal";
import { ZyraPromptChip } from "@/features/zyra/elements/ZyraPromptChip";
import { MapZyraMessageBubble } from "@/features/zyra/lists/MapZyraMessageBubble";
import { ZyraHeader } from "@/features/zyra/sections/ZyraHeader";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { cx } from "@/lib/classNames";
import { useZyra } from "@/hooks";
import type { ZyraMessageResponse, ZyraSuggestionType } from "@/types/zyra";

const MESSAGE_PAGE_SIZE = 50;

const DEFAULT_QUICK_PROMPTS: string[] = [
  "Suggest the match of the day",
  "Ideas for the weekend near me",
  "Tips for smart networking",
  "Show places aligned with my interests",
];

const mapMessages = (messages: ZyraMessageResponse[]) =>
  [...messages]
    .filter((message) => message.role !== "SYSTEM")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((message) => ({
      message: message.content,
      sender: message.role === "USER" ? ("user" as const) : ("zyra" as const),
      timestamp: new Date(message.createdAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

export interface ZyraChatFlowProps {
  seedMessage?: string | null;
}

export const ZyraChatFlow = ({ seedMessage }: ZyraChatFlowProps) => {
  const {
    sessions,
    activeSessionId,
    activeMessages,
    loadingSessions,
    loadingMessages,
    error,
    actions,
  } = useZyra();

  const [initializing, setInitializing] = useState(true);
  const [composerValue, setComposerValue] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [messagePages, setMessagePages] = useState<
    Record<string, { page: number; hasMore: boolean }>
  >({});
  const loadedSessions = useRef<Set<string>>(new Set());
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);

  const hasSessions = sessions.length > 0;
  const mappedMessages = useMemo(
    () => mapMessages(activeMessages),
    [activeMessages]
  );

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [activeSessionId, mappedMessages.length]);

  useEffect(() => {
    const bootstrap = async () => {
      setInitializing(true);
      try {
        const list = await actions.fetchSessions({ size: 20 });
        if (list.length === 0) {
          const session = await actions.createSession();
          loadedSessions.current.delete(session.id);
        } else if (!activeSessionId) {
          actions.setActiveSession(list[0].id);
        }
      } catch {
        // error gestito dallo store
      } finally {
        setInitializing(false);
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      if (sessions[0]) {
      actions.setActiveSession(sessions[0].id);
    }
    return;
  }

  if (loadedSessions.current.has(activeSessionId)) return;

  loadedSessions.current.add(activeSessionId);
  actions
      .fetchMessages(activeSessionId, { size: MESSAGE_PAGE_SIZE })
      .then((messages) => {
        setMessagePages((prev) => ({
          ...prev,
          [activeSessionId]: {
            page: 0,
            hasMore: messages.length === MESSAGE_PAGE_SIZE,
          },
        }));
      })
      .catch(() => undefined);
  }, [actions, activeSessionId, sessions]);

  const ensureSession = useCallback(async (): Promise<string> => {
    if (activeSessionId) return activeSessionId;

    const session = await actions.createSession();
    loadedSessions.current.delete(session.id);
    return session.id;
  }, [actions, activeSessionId]);

  useEffect(() => {
    if (!seedMessage || seededRef.current || initializing) return;
    const sendSeed = async () => {
      seededRef.current = true;
      try {
        const sessionId = await ensureSession();
        await actions.sendMessage(sessionId, { content: seedMessage });
      } catch {
        // gestito dallo store
      }
    };
    sendSeed();
  }, [actions, ensureSession, initializing, seedMessage]);

  const handleSend = async () => {
    const content = composerValue.trim();
    if (!content) return;

    try {
      const sessionId = await ensureSession();
      await actions.sendMessage(sessionId, { content });
      setComposerValue("");
      if (messageContainerRef.current) {
        messageContainerRef.current.scrollTop =
          messageContainerRef.current.scrollHeight;
      }
    } catch {
      // gestito dallo store
    }
  };

  const handleSelectSession = (sessionId: string) => {
    actions.setActiveSession(sessionId);
  };

  const handleDeleteSession = async () => {
    if (!pendingDeleteId || deletingSessionId) return;
    setDeletingSessionId(pendingDeleteId);
    try {
      await actions.deleteSession(pendingDeleteId);
      loadedSessions.current.delete(pendingDeleteId);
      setMessagePages((prev) => {
        const next = { ...prev };
        delete next[pendingDeleteId];
        return next;
      });
    } catch {
      // gestito dallo store
    } finally {
      setDeletingSessionId(null);
      setPendingDeleteId(null);
    }
  };

  const handleNewSession = async () => {
    try {
      const session = await actions.createSession();
      loadedSessions.current.delete(session.id);
      const messages = await actions.fetchMessages(session.id, { size: MESSAGE_PAGE_SIZE });
      setMessagePages((prev) => ({
        ...prev,
        [session.id]: {
          page: 0,
          hasMore: messages.length === MESSAGE_PAGE_SIZE,
        },
      }));
    } catch {
      // gestito dallo store
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setComposerValue(prompt);
  };

  const handleCreateSuggestion = async (type: ZyraSuggestionType) => {
    try {
      await actions.createSuggestion({ suggestionType: type });
      await actions.fetchSuggestions({ size: 10 });
    } catch {
      // gestito dallo store
    }
  };

  const handleLoadMore = async () => {
    if (!activeSessionId) return;
    const meta = messagePages[activeSessionId] ?? { page: 0, hasMore: true };
    if (!meta.hasMore) return;

    const nextPage = meta.page + 1;
    try {
      const messages = await actions.fetchMessages(
        activeSessionId,
        { page: nextPage, size: MESSAGE_PAGE_SIZE },
        { append: true }
      );

      setMessagePages((prev) => ({
        ...prev,
        [activeSessionId]: {
          page: nextPage,
          hasMore: messages.length === MESSAGE_PAGE_SIZE,
        },
      }));
    } catch {
      // gestito dallo store
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="space-y-3 lg:col-span-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Sessions</h2>
          <Button size="sm" variant="secondary" onClick={handleNewSession}>
            New
          </Button>
        </div>

        <Card className="divide-y divide-border/60 p-0">
          {loadingSessions && sessions.length === 0 ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted">
              <Loader size="sm" />
              <span>Loading sessions...</span>
            </div>
          ) : null}

          {!loadingSessions && !hasSessions ? (
            <div className="p-4">
              <p className="text-sm font-semibold text-foreground">
                No sessions
              </p>
              <p className="text-sm text-muted">
                Create a new chat with Zyra to get started.
              </p>
              <div className="mt-3">
                <Button size="sm" onClick={handleNewSession}>
                  Create now
                </Button>
              </div>
            </div>
          ) : null}

          {hasSessions ? (
            <div className="flex max-h-[420px] flex-col overflow-y-auto">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const displayName =
                  session.title && session.title.trim().length > 0
                    ? session.title
                    : `Chat ${session.id.slice(0, 8)}`;
                const createdAtLabel = new Date(session.createdAt).toLocaleDateString(
                  "en-US"
                );

                return (
                  <div
                    key={session.id}
                    className={cx(
                      "flex items-center justify-between gap-3 px-4 py-3 transition",
                      isActive
                        ? "border-l-2 border-zyra-border bg-zyra-glow/40 text-foreground"
                        : "border-l-2 border-transparent hover:bg-surface-muted"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectSession(session.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-semibold">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-subtle">
                        <span>{createdAtLabel}</span>
                        {isActive ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-zyra-text" />
                        ) : null}
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setPendingDeleteId(session.id)}
                        loading={deletingSessionId === session.id}
                        loadingText="Deleting..."
                        className="h-8 w-8 p-0"
                        aria-label="Delete chat"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M6 6l1 14h10l1-14" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="flex min-h-[60vh] flex-col gap-4 p-4">
          <div className="flex flex-col gap-4">
            <ZyraHeader
              title="Zyra"
              subtitle="Chat + advice based on your profile"
              statusLabel="Online"
              className="border-b border-border/70 pb-3"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-border/70 bg-surface px-3 py-2">
                <div className="flex items-center gap-2">
                  <ZyraMark size="xs" glow={false} />
                  <p className="text-xs text-zyra-text">
                    Quick suggestions from Zyra
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-2.5 text-[11px]"
                    onClick={() => handleCreateSuggestion("MATCH_OF_THE_DAY")}
                  >
                    Match of the day
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-2.5 text-[11px]"
                    onClick={() =>
                      handleCreateSuggestion("PLACE_RECOMMENDATION")
                    }
                  >
                    Places for me
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-2.5 text-[11px]"
                    onClick={() => handleCreateSuggestion("USER_RECOMMENDATION")}
                  >
                    Compatible people
                  </Button>
                </div>
              </div>
          </div>

          {initializing ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader size="md" />
                <p className="text-sm text-muted">Preparing the chat...</p>
              </div>
            </div>
          ) : null}

          {!initializing && error && mappedMessages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <ErrorState
                title="Unable to load chat"
                description={error.message}
              />
            </div>
          ) : null}

          {!initializing && !error ? (
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                {DEFAULT_QUICK_PROMPTS.map((prompt) => (
                  <ZyraPromptChip
                    key={prompt}
                    label={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                  />
                ))}
              </div>

              <div className="min-h-[320px] flex-1 rounded-[var(--radius-lg)] border border-border/70 bg-surface">
                {loadingMessages && mappedMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex items-center gap-3">
                      <Loader size="sm" />
                      <p className="text-sm text-muted">Loading messages...</p>
                    </div>
                  </div>
                ) : null}

                {!loadingMessages && mappedMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-6 text-center">
                    <p className="text-sm text-muted">
                      No messages yet. Send something to Zyra to get started.
                    </p>
                  </div>
                ) : null}

                {mappedMessages.length > 0 ? (
                  <div
                    ref={messageContainerRef}
                    className="max-h-[500px] overflow-y-auto p-4"
                    role="log"
                    aria-live="polite"
                  >
                    <MapZyraMessageBubble items={mappedMessages} />
                    <div className="mt-3 flex justify-center">
                      {activeSessionId &&
                      messagePages[activeSessionId]?.hasMore ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={handleLoadMore}
                          disabled={loadingMessages}
                        >
                          Load more
                        </Button>
                      ) : null}
                      {activeSessionId &&
                      messagePages[activeSessionId] &&
                      messagePages[activeSessionId]?.hasMore === false ? (
                        <p className="text-xs text-subtle">
                          End of chat history
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Write to Zyra..."
                  rows={3}
                  value={composerValue}
                  onChange={(e) => setComposerValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-subtle">
                    Zyra responds based on your profile and tests.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={loadingMessages || composerValue.trim().length === 0}
                    loading={loadingMessages}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <Modal
        open={pendingDeleteId !== null}
        title="Delete this chat?"
        description="This action is final. Session messages will be removed."
        onClose={() => setPendingDeleteId(null)}
        secondaryAction={{
          label: "Cancel",
          variant: "secondary",
          onClick: () => setPendingDeleteId(null),
        }}
        primaryAction={{
          label: "Delete",
          variant: "danger",
          onClick: handleDeleteSession,
        }}
      />
    </div>
  );
};
