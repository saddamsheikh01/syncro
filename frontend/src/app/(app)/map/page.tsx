import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { MapOverview } from "@/features/map/flows/MapOverview";

export const metadata: Metadata = {
  title: "Mappa | Syncro",
  description: "Esplora i luoghi vicino a te sulla mappa interattiva.",
};

export default function MapPage() {
  return (
    <MainLayout>
      <MapOverview />
    </MainLayout>
  );
}
