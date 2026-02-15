import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatEntry } from "@/features/social/flows/ChatEntry";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Chat | Syncro"),
    description: t("Your conversations with people you&apos;ve met."),
  };
};

export default function ChatPage() {
  return (
    <MainLayout>
      <ChatEntry />
    </MainLayout>
  );
}
