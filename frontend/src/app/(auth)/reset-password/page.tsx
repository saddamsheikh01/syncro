import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { ResetPassword } from "@/features/auth/ResetPassword";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Set new password | Syncro"),
    description: t("Set a new password for your Syncro account."),
  };
};

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
