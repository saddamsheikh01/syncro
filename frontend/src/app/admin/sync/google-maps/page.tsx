import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminGoogleMapsSyncOverview } from "@/features/admin/flows/sync/AdminGoogleMapsSyncOverview";

export const metadata: Metadata = {
  title: "Admin Sync Google Maps | Syncro",
  description: "Sincronizzazione catalogo con Google Maps dal backoffice admin.",
};

export default function AdminGoogleMapsSyncPage() {
  return (
    <AdminLayout>
      <AdminGoogleMapsSyncOverview />
    </AdminLayout>
  );
}
