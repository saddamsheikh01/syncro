import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminExperiencesOverview } from "@/features/admin/flows/catalog/AdminExperiencesOverview";

export const metadata: Metadata = {
  title: "Admin Experiences | Syncro",
  description: "Gestione esperienze catalogo dal backoffice admin.",
};

export default function AdminExperiencesPage() {
  return (
    <AdminLayout>
      <AdminExperiencesOverview />
    </AdminLayout>
  );
}
