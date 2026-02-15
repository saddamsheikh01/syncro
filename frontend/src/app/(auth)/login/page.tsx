import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { Login } from "@/features/auth/Login";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Sign in | Syncro"),
    description: t("Sign in to your Syncro account."),
  };
};

export default function LoginPage() {
  return <Login />;
}
