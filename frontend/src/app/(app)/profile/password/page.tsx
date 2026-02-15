import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfilePasswordChange } from "@/features/profile/flows/ProfilePasswordChange";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Change password | Syncro"),
    description: t("Update your Syncro account password."),
  };
};

export default function ProfilePasswordPage() {
  return (
    <MainLayout>
      <ProfilePasswordChange />
    </MainLayout>
  );
}
