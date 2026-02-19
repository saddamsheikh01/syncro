import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { SupportOverview } from "@/features/support/flows/SupportOverview";
import { getServerTranslator } from "@/i18n/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Support | Syncro"),
    description: t("Send a message to the Syncro team. We read every message."),
  };
};

export default async function SupportPage() {
  return (
    <MainLayout>
      <SupportOverview />
    </MainLayout>
  );
}
