import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminMatchmakingOverview } from "@/features/admin/flows/AdminMatchmakingOverview";

export const metadata: Metadata = {
  title: "Admin Matchmaking | Syncro",
  description: "Manage matchmaking filters and domain weights from the back office.",
};

export default function AdminMatchmakingPage() {
  return (
    <AdminLayout>
      <AdminMatchmakingOverview />
    </AdminLayout>
  );
}
