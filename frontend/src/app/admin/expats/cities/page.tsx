import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminCitiesOverview } from "@/features/admin/flows/expats/AdminCitiesOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Expats cities | Syncro Admin"),
    description: t("Manage expat relocation city dataset."),
  };
};

export default function AdminExpatsCitiesPage() {
  return (
    <AdminLayout>
      <AdminCitiesOverview />
    </AdminLayout>
  );
}
