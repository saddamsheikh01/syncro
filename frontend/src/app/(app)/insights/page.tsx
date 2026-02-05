import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { Feed } from "@/features/feed/flows/Feed";

export const metadata: Metadata = {
  title: "Insights | Syncro",
  description: "Scopri i post geolocalizzati su Syncro.",
};

export default function InsightsPage() {
  return (
    <MainLayout>
      <Feed />
    </MainLayout>
  );
}
