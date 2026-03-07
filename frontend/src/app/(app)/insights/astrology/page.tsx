import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { AstrologyInsightRunner } from "@/features/insights/flows/AstrologyInsightRunner";
import { getSiteUrl } from "@/lib/siteUrl";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const baseUrl = getSiteUrl();
  const insightUrl = baseUrl ? `${baseUrl}/insights/astrology` : "/insights/astrology";
  const title = t("Birth chart") + " | " + t("Insights") + " | Syncro";
  const description = t("Used for compatibility. Add place and optional time for better accuracy.");

  return {
    title,
    description,
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,
    openGraph: {
      type: "website",
      url: insightUrl,
      siteName: "Syncro",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: insightUrl },
  };
};

export default function AstrologyInsightPage() {
  return (
    <MainLayout>
      <AstrologyInsightRunner />
    </MainLayout>
  );
}
