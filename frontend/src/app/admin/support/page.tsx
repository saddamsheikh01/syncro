import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminSupportOverview } from "@/features/admin/flows/support/AdminSupportOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Support | Syncro"),
    description: t("Review support messages received from users."),
  };
};

export default function AdminSupportPage() {
  return (
    <AdminLayout>
      <AdminSupportOverview />
    </AdminLayout>
  );
}
