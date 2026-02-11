import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminUsersOverview } from "@/features/admin/flows/AdminUsersOverview";

export const metadata: Metadata = {
  title: "Admin Users | Syncro",
  description: "Monitor and manage application users from the back office.",
};

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <AdminUsersOverview />
    </AdminLayout>
  );
}
