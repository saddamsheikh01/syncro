import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminGoogleMapsSyncOverview } from "@/features/admin/flows/sync/AdminGoogleMapsSyncOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Sync Google Maps | Syncro"),
    description: t("Sync the catalog with Google Maps from the admin back office."),
  };
};

export default function AdminGoogleMapsSyncPage() {
  return (
    <AdminLayout>
      <AdminGoogleMapsSyncOverview />
    </AdminLayout>
  );
}
