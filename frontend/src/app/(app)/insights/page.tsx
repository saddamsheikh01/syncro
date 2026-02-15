import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { TestsOverview } from "@/features/insights/flows/TestsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Insights | Syncro"),
    description: t("Complete insights to update your Zyra profile."),
  };
};

export default function InsightsPage() {
  return (
    <MainLayout>
      <TestsOverview />
    </MainLayout>
  );
}
