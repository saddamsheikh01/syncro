import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ExperienceDetail } from "@/features/catalog/flows/ExperienceDetail";

export const metadata: Metadata = {
  title: "Esperienza | Syncro",
  description: "Dettaglio esperienza su Syncro.",
};

type ExperienceDetailPageProps = {
  params: { experienceId: string } | Promise<{ experienceId: string }>;
};

export default async function ExperienceDetailPage({
  params,
}: ExperienceDetailPageProps) {
  const { experienceId } = await params;

  return (
    <MainLayout>
      <ExperienceDetail experienceId={experienceId} />
    </MainLayout>
  );
}
