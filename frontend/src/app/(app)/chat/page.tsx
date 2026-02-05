import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ChatEntry } from "@/features/social/flows/ChatEntry";

export const metadata: Metadata = {
  title: "Chat | Syncro",
  description: "Your conversations with people you&apos;ve met.",
};

export default function ChatPage() {
  return (
    <MainLayout>
      <ChatEntry />
    </MainLayout>
  );
}
