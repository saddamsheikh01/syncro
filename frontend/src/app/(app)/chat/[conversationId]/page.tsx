import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatDetail } from "@/features/social/flows/ChatDetail";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Conversation | Syncro"),
    description: t("Chat with another user."),
  };
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
