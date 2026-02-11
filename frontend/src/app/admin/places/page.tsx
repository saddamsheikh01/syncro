import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminPlacesOverview } from "@/features/admin/flows/catalog/AdminPlacesOverview";

export const metadata: Metadata = {
  title: "Admin Places | Syncro",
  description: "Manage catalog places from the admin back office.",
};

export default function AdminPlacesPage() {
  return (
    <AdminLayout>
      <AdminPlacesOverview />
    </AdminLayout>
  );
}
