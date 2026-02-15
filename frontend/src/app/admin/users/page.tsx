import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminUsersOverview } from "@/features/admin/flows/AdminUsersOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Users | Syncro"),
    description: t("Monitor and manage application users from the back office."),
  };
};

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <AdminUsersOverview />
    </AdminLayout>
  );
}
