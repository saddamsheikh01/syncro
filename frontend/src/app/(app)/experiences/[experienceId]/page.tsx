import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { SharedPageLayout } from "@/components/layout/SharedPageLayout";
import { ExperienceDetail } from "@/features/catalog/flows/ExperienceDetail";
import { getSiteUrl } from "@/lib/siteUrl";

type ExperienceDetailPageProps = {
  params: Promise<{ experienceId: string }>;
};

export const generateMetadata = async ({
  params,
}: ExperienceDetailPageProps): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const { experienceId } = await params;
  const baseUrl = getSiteUrl();
  const experienceUrl = baseUrl ? `${baseUrl}/experiences/${experienceId}` : `/experiences/${experienceId}`;
  const title = t("Experience | Syncro");
  const description = t("Experience details on Syncro. Find experiences that match you.");

  return {
    title,
    description,
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,
    openGraph: {
      type: "website",
      url: experienceUrl,
      siteName: "Syncro",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: experienceUrl },
  };
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
