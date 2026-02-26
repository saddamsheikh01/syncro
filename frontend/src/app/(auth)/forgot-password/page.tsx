import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { ForgotPassword } from "@/features/auth/ForgotPassword";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Reset password | Syncro"),
    description: t("Request a password reset link for your Syncro account."),
  };
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
