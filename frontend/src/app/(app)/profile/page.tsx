import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileSettings } from "@/features/profile/flows/ProfileSettings";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Profile | Syncro"),
    description: t("Manage your Syncro profile."),
  };
};

export default function ProfilePage() {
  return (
    <MainLayout>
      <ProfileSettings />
    </MainLayout>
  );
}
