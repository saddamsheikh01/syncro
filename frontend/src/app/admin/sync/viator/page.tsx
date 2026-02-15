import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminViatorSyncOverview } from "@/features/admin/flows/sync/AdminViatorSyncOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Sync Viator | Syncro"),
    description: t("Sync the experiences catalog with Viator from the admin back office."),
  };
};

export default function AdminViatorSyncPage() {
  return (
    <AdminLayout>
      <AdminViatorSyncOverview />
    </AdminLayout>
  );
}
