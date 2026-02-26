import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfilePasswordChange } from "@/features/profile/flows/ProfilePasswordChange";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Reset password | Syncro"),
    description: t("Request a secure password reset link for your Syncro account."),
  };
};

export default function ProfilePasswordPage() {
  return (
    <MainLayout>
      <ProfilePasswordChange />
    </MainLayout>
  );
}
