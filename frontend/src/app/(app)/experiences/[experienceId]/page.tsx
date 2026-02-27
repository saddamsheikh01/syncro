import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { SharedPageLayout } from "@/components/layout/SharedPageLayout";
import { ExperienceDetail } from "@/features/catalog/flows/ExperienceDetail";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Experience | Syncro"),
    description: t("Experience details on Syncro."),
  };
};

type ExperienceDetailPageProps = {
  params: Promise<{ experienceId: string }>;
};

export default async function ExperienceDetailPage({
  params,
}: ExperienceDetailPageProps) {
  const { experienceId } = await params;

  return (
    <SharedPageLayout>
      <ExperienceDetail experienceId={experienceId} />
    </SharedPageLayout>
  );
}
