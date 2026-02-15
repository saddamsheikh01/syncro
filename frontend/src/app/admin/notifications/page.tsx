import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminNotificationsOverview } from "@/features/admin/flows/notifications/AdminNotificationsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Notifications | Syncro"),
    description: t("Send custom notifications from the admin back office."),
  };
};

export default function AdminNotificationsPage() {
  return (
    <AdminLayout>
      <AdminNotificationsOverview />
    </AdminLayout>
  );
}
