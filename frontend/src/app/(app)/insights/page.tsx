import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { TestsOverview } from "@/features/insights/flows/TestsOverview";

export const metadata: Metadata = {
  title: "Insights | Syncro",
  description: "Complete insights to update your Zyra profile.",
};

export default function InsightsPage() {
  return (
    <MainLayout>
      <TestsOverview />
    </MainLayout>
  );
}
