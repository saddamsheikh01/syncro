import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminReferralsOverview } from "@/features/admin/flows/referrals/AdminReferralsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Referrals | Syncro"),
    description: t("Monitor referrals from the admin back office."),
  };
};

export default function AdminReferralsPage() {
  return (
    <AdminLayout>
      <AdminReferralsOverview />
    </AdminLayout>
  );
}
