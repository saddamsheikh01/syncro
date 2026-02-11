import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminCategoriesOverview } from "@/features/admin/flows/catalog/AdminCategoriesOverview";

export const metadata: Metadata = {
  title: "Admin Categories | Syncro",
  description: "Gestione categorie catalogo dal backoffice admin.",
};

export default function AdminCategoriesPage() {
  return (
    <AdminLayout>
      <AdminCategoriesOverview />
    </AdminLayout>
  );
}
