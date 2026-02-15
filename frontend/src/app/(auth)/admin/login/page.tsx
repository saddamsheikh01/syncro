import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLogin } from "@/features/admin/auth/AdminLogin";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Login | Syncro"),
    description: t("Sign in to the Syncro back office."),
  };
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}
