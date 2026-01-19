import type { Metadata } from "next";
import { ChatDetail } from "@/features/social/flows/ChatDetail";

export const metadata: Metadata = {
  title: "Conversazione | Syncro",
  description: "Chat con un altro utente.",
};

interface ChatDetailPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { conversationId } = await params;

  return (
    <div className="h-[100dvh]">
      <ChatDetail conversationId={conversationId} />
    </div>
  );
}
