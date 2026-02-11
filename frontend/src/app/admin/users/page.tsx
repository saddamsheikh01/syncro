import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminUsersOverview } from "@/features/admin/flows/AdminUsersOverview";

export const metadata: Metadata = {
  title: "Admin Users | Syncro",
  description: "Monitoraggio utenti applicazione dal backoffice.",
};

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <AdminUsersOverview />
    </AdminLayout>
  );
}
