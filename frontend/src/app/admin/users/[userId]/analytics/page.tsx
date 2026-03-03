import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminUserAnalyticsOverview } from "@/features/admin/flows/AdminUserAnalyticsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("User Analytics | Syncro"),
    description: t("Per-user analytics in the admin back office."),
  };
};

export default async function AdminUserAnalyticsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <AdminLayout>
      <AdminUserAnalyticsOverview userId={userId} />
    </AdminLayout>
  );
}
