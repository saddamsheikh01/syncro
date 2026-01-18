import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { Feed } from "@/features/feed/flows/Feed";

export const metadata: Metadata = {
  title: "Feed | Syncro",
  description: "Scopri i post geolocalizzati su Syncro.",
};

export default function FeedPage() {
  return (
    <MainLayout>
      <Feed />
    </MainLayout>
  );
}
