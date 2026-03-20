import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminWaitingListOverview } from "@/features/admin/flows/expats/AdminWaitingListOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: `${t("Expats waiting list")} | ${t("Syncro Admin")}`,
    description: t("Users waiting for cities not yet in the relocation dataset."),
  };
};

export default function AdminExpatsWaitingListPage() {
  return (
    <AdminLayout>
      <AdminWaitingListOverview />
    </AdminLayout>
  );
}
