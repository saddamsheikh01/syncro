import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { AstrologyInsightRunner } from "@/features/insights/flows/AstrologyInsightRunner";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Birth chart") + " | " + t("Insights") + " | Syncro",
    description: t("Used for compatibility. Add place and optional time for better accuracy."),
  };
};

export default function AstrologyInsightPage() {
  return (
    <MainLayout>
      <AstrologyInsightRunner />
    </MainLayout>
  );
}
