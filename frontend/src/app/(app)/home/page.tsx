import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { HomeOverview } from "@/features/home/flows/HomeOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Home | Syncro"),
    description: t("Discover suggestions, matches, and places curated for you."),
  };
};

export default function HomePage() {
  return (
    <MainLayout>
      <HomeOverview />
    </MainLayout>
  );
}
