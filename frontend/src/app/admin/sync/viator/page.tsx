import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminViatorSyncOverview } from "@/features/admin/flows/sync/AdminViatorSyncOverview";

export const metadata: Metadata = {
  title: "Admin Sync Viator | Syncro",
  description: "Sync the experiences catalog with Viator from the admin back office.",
};

export default function AdminViatorSyncPage() {
  return (
    <AdminLayout>
      <AdminViatorSyncOverview />
    </AdminLayout>
  );
}
