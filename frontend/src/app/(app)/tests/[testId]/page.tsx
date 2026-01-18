import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { TestRunner } from "@/features/tests/flows/TestRunner";

export const metadata: Metadata = {
  title: "Test | Syncro",
  description: "Rispondi alle domande del micro-test Syncro.",
};

type TestRunnerPageProps = {
  params: { testId: string } | Promise<{ testId: string }>;
};

export default async function TestRunnerPage({ params }: TestRunnerPageProps) {
  const { testId } = await params;

  return (
    <MainLayout>
      <TestRunner testId={testId} />
    </MainLayout>
  );
}
