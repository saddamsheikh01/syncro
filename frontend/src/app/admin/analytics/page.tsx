import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminAnalyticsOverview } from "@/features/admin/flows/AdminAnalyticsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Analytics | Syncro"),
    description: t("KPI analytics, user trends, and product performance."),
  };
};

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <AdminAnalyticsOverview />
    </AdminLayout>
  );
}
