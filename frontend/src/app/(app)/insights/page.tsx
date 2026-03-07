import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { TestsOverview } from "@/features/insights/flows/TestsOverview";
import { getSiteUrl } from "@/lib/siteUrl";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const baseUrl = getSiteUrl();
  const insightUrl = baseUrl ? `${baseUrl}/insights` : "/insights";
  const title = t("Insights | Syncro");
  const description = t("Complete insights to update your Zyra profile.");

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

export default function InsightsPage() {
  return (
    <MainLayout>
      <TestsOverview />
    </MainLayout>
  );
}
