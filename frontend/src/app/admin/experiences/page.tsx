import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminExperiencesOverview } from "@/features/admin/flows/catalog/AdminExperiencesOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Experiences | Syncro"),
    description: t("Manage catalog experiences from the admin back office."),
  };
};

export default function AdminExperiencesPage() {
  return (
    <AdminLayout>
      <AdminExperiencesOverview />
    </AdminLayout>
  );
}
