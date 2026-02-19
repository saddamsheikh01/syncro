import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileSettings } from "@/features/profile/flows/ProfileSettings";
import { getServerTranslator } from "@/i18n/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Settings | Syncro"),
    description: t("Manage your Syncro account settings."),
  };
};

export default async function SettingsPage() {
  const { t } = await getServerTranslator();

  return (
    <MainLayout>
      <ProfileSettings
        title={t("Settings")}
        subtitle={t("Update your details and main preferences.")}
      />
    </MainLayout>
  );
}