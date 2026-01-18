import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { TestRunner } from "@/features/tests/flows/TestRunner";

export const metadata: Metadata = {
  title: "Test | Syncro",
  description: "Rispondi alle domande del micro-test Syncro.",
};

type TestRunnerPageProps = {
  params: {
    testId: string;
  };
};

export default function TestRunnerPage({ params }: TestRunnerPageProps) {
  return (
    <MainLayout>
      <TestRunner testId={params.testId} />
    </MainLayout>
  );
}
