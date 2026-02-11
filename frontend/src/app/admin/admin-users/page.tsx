import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminAdminsOverview } from "@/features/admin/flows/AdminAdminsOverview";

export const metadata: Metadata = {
  title: "Admin Admin Users | Syncro",
  description: "Manage and control administrator accounts.",
};

export default function AdminAdminsPage() {
  return (
    <AdminLayout>
      <AdminAdminsOverview />
    </AdminLayout>
  );
}
