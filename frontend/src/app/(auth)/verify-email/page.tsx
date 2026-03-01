import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { VerifyEmail } from "@/features/auth/VerifyEmail";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Verify email | Syncro"),
    description: t("Verify your email address to complete your Syncro account."),
  };
};

export default function VerifyEmailPage() {
  return <VerifyEmail />;
}
