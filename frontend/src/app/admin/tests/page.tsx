import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminTestsOverview } from "@/features/admin/flows/AdminTestsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Insights | Syncro"),
    description: t("Insights test overview and current configuration."),
  };
};

export default function AdminTestsPage() {
  return (
    <AdminLayout>
      <AdminTestsOverview />
    </AdminLayout>
  );
}
