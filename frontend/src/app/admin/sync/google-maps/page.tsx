import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminGoogleMapsSyncOverview } from "@/features/admin/flows/sync/AdminGoogleMapsSyncOverview";

export const metadata: Metadata = {
  title: "Admin Sync Google Maps | Syncro",
  description: "Sync the catalog with Google Maps from the admin back office.",
};

export default function AdminGoogleMapsSyncPage() {
  return (
    <AdminLayout>
      <AdminGoogleMapsSyncOverview />
    </AdminLayout>
  );
}
