import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { FavoritesOverview } from "@/features/favorites/flows/FavoritesOverview";

export const metadata: Metadata = {
  title: "Preferiti | Syncro",
  description: "Raccogli e gestisci i tuoi luoghi ed esperienze salvati.",
};

export default function FavoritesPage() {
  return (
    <MainLayout>
      <FavoritesOverview />
    </MainLayout>
  );
}
