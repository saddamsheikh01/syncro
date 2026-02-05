import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { MapOverview } from "@/features/map/flows/MapOverview";

export const metadata: Metadata = {
  title: "Map | Syncro",
  description: "Explore places near you on the interactive map.",
};

export default function MapPage() {
  return (
    <MainLayout>
      <MapOverview />
    </MainLayout>
  );
}
