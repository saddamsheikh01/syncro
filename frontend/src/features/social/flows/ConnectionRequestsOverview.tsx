"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Avatar } from "@/components/elements/Avatar";
import { useChat, useT } from "@/hooks";
import { getPendingConnections, acceptConnection, rejectConnection } from "@/services/social";
import { getUserProfile } from "@/services/users";
import type { ConnectionResponse } from "@/types/social";
import type { UserPublicProfileResponse } from "@/types/profile";
import type { ConnectionContext } from "@/types/social";

const CONTEXT_LABEL_KEYS: Record<ConnectionContext, string> = {
  WORK: "Context: Work",
  FRIENDSHIP: "Context: Friendship",
  PROJECTS: "Context: Projects",
  LOVE: "Context: Love",
  OTHER: "Context: Other",
};

type PendingWithSender = ConnectionResponse & {
  senderProfile: UserPublicProfileResponse | null;
};

const resolveDisplayName = (profile: UserPublicProfileResponse | null, t: (key: string, v?: Record<string, string>) => string): string => {
  if (!profile) return t("User");
  const name = profile.fullName?.trim() || profile.username?.trim();
  return name || t("User {id}", { id: profile.userId.slice(0, 6) });
};

export const ConnectionRequestsOverview = () => {
  const { t } = useT();
  const router = useRouter();
  const { actions: chatActions } = useChat();
  const [pending, setPending] = useState<PendingWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [justAccepted, setJustAccepted] = useState<{
    conversationId: string;
    name: string;
    fromUserId: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPendingConnections({ size: 50 });
      const list = res.content ?? [];
      const profiles = await Promise.all(
        list.map((c) =>
          getUserProfile(c.fromUserId).catch(() => null)
        )
      );
      setPending(
        list.map((conn, i) => ({
          ...conn,
          senderProfile: profiles[i] ?? null,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Unable to load connection requests"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = useCallback(
    async (connectionId: string, fromUserId: string) => {
      const item = pending.find((c) => c.id === connectionId);
      const name = item ? resolveDisplayName(item.senderProfile, t) : t("User");
      setActionId(connectionId);
      try {
        await acceptConnection(connectionId);
        const conversation = await chatActions.createConversation({
          otherUserId: fromUserId,
        });
        setPending((prev) => prev.filter((c) => c.id !== connectionId));
        setJustAccepted({
          conversationId: conversation.id,
          name,
          fromUserId,
        });
      } catch {
        // Error could be shown via toast
      } finally {
        setActionId(null);
      }
    },
    [chatActions, pending, t]
  );

  const handleReject = useCallback(
    async (connectionId: string) => {
      setActionId(connectionId);
      try {
        await rejectConnection(connectionId);
        setPending((prev) => prev.filter((c) => c.id !== connectionId));
      } catch {
        // Error could be shown via toast
      } finally {
        setActionId(null);
      }
    },
    []
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          {t("Connections")}
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          {t("Connection requests")}
        </h1>
        <p className="text-sm text-muted">
          {t("Accept or reject connection requests. You can chat after accepting.")}
        </p>
      </header>

      {loading && (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading connection requests...")}</p>
        </Card>
      )}

      {error && !loading && (
        <div className="space-y-3">
          <ErrorState
            title={t("Unable to load connection requests")}
            description={error}
          />
          <Button variant="secondary" onClick={load}>
            {t("Retry")}
          </Button>
        </div>
      )}

      {!loading && !error && pending.length === 0 && !justAccepted && (
        <EmptyState
          title={t("No pending requests")}
          description={t("When someone sends you a connection request, it will appear here.")}
          actionLabel={t("Discover people")}
          actionHref="/matches"
        />
      )}

      {justAccepted && (
        <Card className="flex flex-col gap-3 border-accent/30 bg-accent-soft/40 p-4">
          <p className="text-sm font-medium text-foreground">
            {t("Connection accepted. You can now chat with {name}.", {
              name: justAccepted.name,
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                router.push(`/chat/${justAccepted.conversationId}`);
                setJustAccepted(null);
              }}
            >
              {t("Message")} {justAccepted.name}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setJustAccepted(null)}
            >
              {t("Dismiss")}
            </Button>
          </div>
        </Card>
      )}

      {!loading && !error && pending.length > 0 && (
        <div className="flex flex-col gap-3">
          {pending.map((item) => {
            const name = resolveDisplayName(item.senderProfile, t);
            const avatarUrl = item.senderProfile?.avatarUrl ?? undefined;
            const contextLabel = t(CONTEXT_LABEL_KEYS[item.context]);
            const busy = actionId === item.id;

            return (
              <Card key={item.id} className="flex items-center gap-4 p-4">
                <Link
                  href={`/profile/${item.fromUserId}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar name={name} src={avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted">{contextLabel}</p>
                  </div>
                </Link>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleAccept(item.id, item.fromUserId)}
                    disabled={busy}
                    loading={busy}
                    loadingText={t("Accept")}
                  >
                    {t("Accept")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleReject(item.id)}
                    disabled={busy}
                    loading={busy}
                    loadingText={t("Reject")}
                  >
                    {t("Reject")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && pending.length > 0 && (
        <p className="text-center text-xs text-subtle">
          {t("{count} pending request(s)", { count: pending.length })}
        </p>
      )}
    </div>
  );
};
