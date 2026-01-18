import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ExperiencesOverview } from "@/features/catalog/flows/ExperiencesOverview";

export const metadata: Metadata = {
  title: "Esperienze | Syncro",
  description: "Scopri esperienze uniche selezionate per te.",
};

export default function ExperiencesPage() {
  return (
    <MainLayout>
      <ExperiencesOverview />
    </MainLayout>
  );
}
