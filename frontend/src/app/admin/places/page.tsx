import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminPlacesOverview } from "@/features/admin/flows/catalog/AdminPlacesOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Places | Syncro"),
    description: t("Manage catalog places from the admin back office."),
  };
};

export default function AdminPlacesPage() {
  return (
    <AdminLayout>
      <AdminPlacesOverview />
    </AdminLayout>
  );
}
