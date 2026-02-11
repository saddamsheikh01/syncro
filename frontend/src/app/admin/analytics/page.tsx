import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminAnalyticsOverview } from "@/features/admin/flows/AdminAnalyticsOverview";

export const metadata: Metadata = {
  title: "Admin Analytics | Syncro",
  description: "KPI analytics, trend utenti e performance di prodotto.",
};

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <AdminAnalyticsOverview />
    </AdminLayout>
  );
}
