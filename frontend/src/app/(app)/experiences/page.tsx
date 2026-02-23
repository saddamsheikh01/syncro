import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { ExperiencesOverview } from "@/features/catalog/flows/ExperiencesOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Experiences | Syncro"),
    description: t("Discover unique experiences selected for you."),
  };
};

export default function ExperiencesPage() {
  return (
    <MainLayout>
      <ExperiencesOverview />
    </MainLayout>
  );
}
