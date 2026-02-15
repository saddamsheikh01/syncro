import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminRegister } from "@/features/admin/auth/AdminRegister";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Registration | Syncro"),
    description: t("Create a Syncro admin account."),
  };
};

export default function AdminRegisterPage() {
  return <AdminRegister />;
}
