import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { MapOverview } from "@/features/map/flows/MapOverview";
import { PlacesOverview } from "@/features/catalog/flows/PlacesOverview";

export const metadata: Metadata = {
  title: "Places | Syncro",
  description: "Explore places selected for you.",
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
