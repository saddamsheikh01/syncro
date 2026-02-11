import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminTestsOverview } from "@/features/admin/flows/AdminTestsOverview";

export const metadata: Metadata = {
  title: "Admin Insights | Syncro",
  description: "Insights test overview and current configuration.",
};

export default function AdminTestsPage() {
  return (
    <AdminLayout>
      <AdminTestsOverview />
    </AdminLayout>
  );
}
