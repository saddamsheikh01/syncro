import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { MapOverview } from "@/features/map/flows/MapOverview";
import { PlacesOverview } from "@/features/catalog/flows/PlacesOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Places | Syncro"),
    description: t("Explore places selected for you."),
  };
};

export default function PlacesPage() {
  return (
    <MainLayout>
      <div className="space-y-10">
        <MapOverview />
        <PlacesOverview />
      </div>
    </MainLayout>
  );
}
