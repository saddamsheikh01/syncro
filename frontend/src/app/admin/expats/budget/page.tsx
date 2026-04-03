import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminBudgetOverview } from "@/features/admin/flows/expats/AdminBudgetOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Budget Simulations | Syncro Admin"),
    description: t("All budget simulations with KPIs and filters."),
  };
};

export default function AdminBudgetPage() {
  return (
    <AdminLayout>
      <AdminBudgetOverview />
    </AdminLayout>
  );
}
