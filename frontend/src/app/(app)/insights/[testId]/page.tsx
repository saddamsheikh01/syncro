import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { TestRunner } from "@/features/insights/flows/TestRunner";

export const metadata: Metadata = {
  title: "Insight | Syncro",
  description: "Answer the questions to generate new Syncro insights.",
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
