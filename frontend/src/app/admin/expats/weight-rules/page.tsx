import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminWeightRulesOverview } from "@/features/admin/flows/expats/AdminWeightRulesOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: `${t("Weight rules")} | ${t("Syncro Admin")}`,
    description: t("Expat scoring weight rules."),
  };
};

export default function AdminExpatsWeightRulesPage() {
  return (
    <AdminLayout>
      <AdminWeightRulesOverview />
    </AdminLayout>
  );
}
