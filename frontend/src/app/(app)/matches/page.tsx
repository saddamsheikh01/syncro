import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { MatchesOverview } from "@/features/matches/flows/MatchesOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Matches | Syncro"),
    description: t("Discover the users most aligned with you."),
  };
};

export default function MatchesPage() {
  return (
    <MainLayout>
      <MatchesOverview />
    </MainLayout>
  );
}
