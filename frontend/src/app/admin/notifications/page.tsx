import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminNotificationsOverview } from "@/features/admin/flows/notifications/AdminNotificationsOverview";

export const metadata: Metadata = {
  title: "Admin Notifications | Syncro",
  description: "Invio notifiche custom dal backoffice admin.",
};

export default function AdminNotificationsPage() {
  return (
    <AdminLayout>
      <AdminNotificationsOverview />
    </AdminLayout>
  );
}
