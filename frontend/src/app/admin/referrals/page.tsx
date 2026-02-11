import type { Metadata } from "next";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminReferralsOverview } from "@/features/admin/flows/referrals/AdminReferralsOverview";

export const metadata: Metadata = {
  title: "Admin Referrals | Syncro",
  description: "Monitoraggio referral dal backoffice admin.",
};

export default function AdminReferralsPage() {
  return (
    <AdminLayout>
      <AdminReferralsOverview />
    </AdminLayout>
  );
}
