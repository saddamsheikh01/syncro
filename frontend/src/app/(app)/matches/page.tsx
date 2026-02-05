import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { MatchesOverview } from "@/features/matches/flows/MatchesOverview";

export const metadata: Metadata = {
  title: "Matches | Syncro",
  description: "Discover the users most aligned with you.",
};

export default function MatchesPage() {
  return (
    <MainLayout>
      <MatchesOverview />
    </MainLayout>
  );
}
