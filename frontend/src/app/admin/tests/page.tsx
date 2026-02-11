import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminTestsOverview } from "@/features/admin/flows/AdminTestsOverview";

export const metadata: Metadata = {
  title: "Admin Insights | Syncro",
  description: "Panoramica test insights e configurazione attuale.",
};

export default function AdminTestsPage() {
  return (
    <AdminLayout>
      <AdminTestsOverview />
    </AdminLayout>
  );
}
