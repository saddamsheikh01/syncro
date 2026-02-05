import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { HomeOverview } from "@/features/home/flows/HomeOverview";

export const metadata: Metadata = {
  title: "Home | Syncro",
  description: "Discover suggestions, matches, and places curated for you.",
};

export default function HomePage() {
  return (
    <MainLayout>
      <HomeOverview />
    </MainLayout>
  );
}
