import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { MapOverview } from "@/features/map/flows/MapOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Map | Syncro"),
    description: t("Explore places near you on the interactive map."),
  };
};

export default function MapPage() {
  return (
    <MainLayout>
      <MapOverview />
    </MainLayout>
  );
}
