import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminFunnelAnalyticsOverview } from "@/features/admin/flows/expats/AdminFunnelAnalyticsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Funnel Analytics | Syncro Admin"),
    description: t("Completion rates, drop-off analysis and answer distributions."),
  };
};

export default function AdminFunnelAnalyticsPage() {
  return (
    <AdminLayout>
      <AdminFunnelAnalyticsOverview />
    </AdminLayout>
  );
}
