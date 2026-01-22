import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
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
    <MainLayout>
      <div className="h-[calc(100dvh-theme(spacing.36))] lg:h-[calc(100dvh-theme(spacing.44))]">
        <ChatDetail conversationId={conversationId} />
      </div>
    </MainLayout>
  );
}
