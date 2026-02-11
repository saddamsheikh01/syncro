import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminPlacesOverview } from "@/features/admin/flows/catalog/AdminPlacesOverview";

export const metadata: Metadata = {
  title: "Admin Places | Syncro",
  description: "Gestione luoghi catalogo dal backoffice admin.",
};

export default function AdminPlacesPage() {
  return (
    <AdminLayout>
      <AdminPlacesOverview />
    </AdminLayout>
  );
}
