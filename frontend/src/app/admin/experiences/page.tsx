import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminExperiencesOverview } from "@/features/admin/flows/catalog/AdminExperiencesOverview";

export const metadata: Metadata = {
  title: "Admin Experiences | Syncro",
  description: "Manage catalog experiences from the admin back office.",
};

export default function AdminExperiencesPage() {
  return (
    <AdminLayout>
      <AdminExperiencesOverview />
    </AdminLayout>
  );
}
