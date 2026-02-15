import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminMatchmakingOverview } from "@/features/admin/flows/AdminMatchmakingOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Admin Matchmaking | Syncro"),
    description: t("Manage matchmaking filters and domain weights from the back office."),
  };
};

export default function AdminMatchmakingPage() {
  return (
    <AdminLayout>
      <AdminMatchmakingOverview />
    </AdminLayout>
  );
}
