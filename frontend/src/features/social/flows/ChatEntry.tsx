"use client";

import { useEffect, useState } from "react";
import { ChatConversationList } from "@/features/social/flows/ChatConversationList";
import { ZyraChatFlow } from "@/features/zyra/flows/ZyraChatFlow";
import { readZyraSeedMessage } from "@/lib/zyraSeed";

export const ChatEntry = () => {
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const message = readZyraSeedMessage();
    if (message) {
      setSeedMessage(message);
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  if (seedMessage) {
    return <ZyraChatFlow seedMessage={seedMessage} />;
  }

  return <ChatConversationList />;
};
