import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { FavoritesOverview } from "@/features/favorites/flows/FavoritesOverview";

export const metadata: Metadata = {
  title: "Favorites | Syncro",
  description: "Collect and manage your saved places and experiences.",
};

export default function FavoritesPage() {
  return (
    <MainLayout>
      <FavoritesOverview />
    </MainLayout>
  );
}
