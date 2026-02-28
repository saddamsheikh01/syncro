"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { getConnectionStatusWith, sendConnectionRequest } from "@/services/social";
import { useChat, useT } from "@/hooks";
import type { ConnectionContext, ConnectionStatus } from "@/types/social";

const DEFAULT_CONTEXT: ConnectionContext = "FRIENDSHIP";

type ConnectButtonProps = {
  userId: string;
  profileHref: string;
  className?: string;
};

export const ConnectButton = ({
  userId,
  profileHref,
  className,
}: ConnectButtonProps) => {
  const { t } = useT();
  const router = useRouter();
  const { actions: chatActions } = useChat();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getConnectionStatusWith(userId)
      .then((res) => {
        if (!cancelled) setStatus(res.status ?? null);
      })
      .catch(() => {
        if (!cancelled) setStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleConnect = useCallback(async () => {
    setSendLoading(true);
    try {
      await sendConnectionRequest({ toUserId: userId, context: DEFAULT_CONTEXT });
      setStatus("PENDING");
    } finally {
      setSendLoading(false);
    }
  }, [userId]);

  const handleMessage = useCallback(() => {
    setMessageLoading(true);
    chatActions
      .createConversation({ otherUserId: userId })
      .then((conversation) => router.push(`/chat/${conversation.id}`))
      .finally(() => setMessageLoading(false));
  }, [userId, chatActions, router]);

  if (loading) {
    return (
      <Button size="sm" variant="secondary" className={className} disabled>
        {t("Connect")}
      </Button>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <Button
        size="sm"
        variant="primary"
        className={className}
        onClick={handleMessage}
        loading={messageLoading}
        loadingText={t("Message")}
      >
        {t("Message")}
      </Button>
    );
  }

  if (status === "PENDING") {
    return (
      <Button size="sm" variant="secondary" className={className} disabled>
        {t("Request sent")}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="primary"
      className={className}
      onClick={handleConnect}
      loading={sendLoading}
      loadingText={t("Sending...")}
    >
      {t("Connect")}
    </Button>
  );
};
