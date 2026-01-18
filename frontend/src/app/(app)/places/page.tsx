import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { PlacesOverview } from "@/features/catalog/flows/PlacesOverview";

export const metadata: Metadata = {
  title: "Luoghi | Syncro",
  description: "Esplora luoghi selezionati per te.",
};

export default function PlacesPage() {
  return (
    <MainLayout>
      <PlacesOverview />
    </MainLayout>
  );
}
