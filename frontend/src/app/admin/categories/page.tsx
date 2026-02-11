import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminCategoriesOverview } from "@/features/admin/flows/catalog/AdminCategoriesOverview";

export const metadata: Metadata = {
  title: "Admin Categories | Syncro",
  description: "Manage catalog categories from the admin back office.",
};

export default function AdminCategoriesPage() {
  return (
    <AdminLayout>
      <AdminCategoriesOverview />
    </AdminLayout>
  );
}
