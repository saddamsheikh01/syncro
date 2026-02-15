import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { TestRunner } from "@/features/insights/flows/TestRunner";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Insight | Syncro"),
    description: t("Answer the questions to generate new Syncro insights."),
  };
};

type TestRunnerPageProps = {
  params: Promise<{ testId: string }>;
};

export default async function TestRunnerPage({ params }: TestRunnerPageProps) {
  const { testId } = await params;

  return (
    <MainLayout>
      <TestRunner testId={testId} />
    </MainLayout>
  );
}
