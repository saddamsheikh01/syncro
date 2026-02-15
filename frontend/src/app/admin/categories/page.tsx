import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminCategoriesOverview } from "@/features/admin/flows/catalog/AdminCategoriesOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Categories | Syncro"),
    description: t("Manage catalog categories from the admin back office."),
  };
};

export default function AdminCategoriesPage() {
  return (
    <AdminLayout>
      <AdminCategoriesOverview />
    </AdminLayout>
  );
}
