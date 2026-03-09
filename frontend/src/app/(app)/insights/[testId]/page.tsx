import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { TestRunner } from "@/features/insights/flows/TestRunner";
import { getSiteUrl } from "@/lib/siteUrl";

type TestRunnerPageProps = {
  params: Promise<{ testId: string }>;
};

export const generateMetadata = async ({
  params,
}: TestRunnerPageProps): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const { testId } = await params;
  const baseUrl = getSiteUrl();
  const insightUrl = baseUrl ? `${baseUrl}/insights/${testId}` : `/insights/${testId}`;
  const title = t("Insight | Syncro");
  const description = t("Answer the questions to generate new Syncro insights.");

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

export default async function TestRunnerPage({ params }: TestRunnerPageProps) {
  const { testId } = await params;

  return (
    <MainLayout>
      <TestRunner testId={testId} />
    </MainLayout>
  );
}
