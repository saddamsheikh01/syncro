import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatConversationList } from "@/features/social/flows/ChatConversationList";

export const metadata: Metadata = {
  title: "Chat | Syncro",
  description: "Le tue conversazioni con le persone che hai incontrato.",
};

export default function ChatPage() {
  return (
    <MainLayout>
      <ChatConversationList />
    </MainLayout>
  );
}
