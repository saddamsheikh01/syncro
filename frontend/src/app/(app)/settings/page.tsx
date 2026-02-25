import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { SettingsOverview } from "@/features/profile/flows/SettingsOverview";
import { getServerTranslator } from "@/i18n/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Settings | Syncro"),
    description: t("Manage your Syncro account settings."),
  };
};

export default async function SettingsPage() {
  return (
    <MainLayout>
      <SettingsOverview />
    </MainLayout>
  );
}
