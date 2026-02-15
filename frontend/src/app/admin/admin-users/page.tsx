import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminAdminsOverview } from "@/features/admin/flows/AdminAdminsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Admin Users | Syncro"),
    description: t("Manage and control administrator accounts."),
  };
};

export default function AdminAdminsPage() {
  return (
    <AdminLayout>
      <AdminAdminsOverview />
    </AdminLayout>
  );
}
