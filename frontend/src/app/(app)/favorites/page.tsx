import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { FavoritesOverview } from "@/features/favorites/flows/FavoritesOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Favorites | Syncro"),
    description: t("Collect and manage your saved places and experiences."),
  };
};

export default function FavoritesPage() {
  return (
    <MainLayout>
      <FavoritesOverview />
    </MainLayout>
  );
}
