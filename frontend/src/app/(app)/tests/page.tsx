import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { TestsOverview } from "@/features/tests/flows/TestsOverview";

export const metadata: Metadata = {
  title: "Micro-test | Syncro",
  description: "Completa i micro-test per aggiornare il profilo Zyra.",
};

export default function TestsPage() {
  return (
    <MainLayout>
      <TestsOverview />
    </MainLayout>
  );
}
