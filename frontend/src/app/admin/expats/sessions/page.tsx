import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminSessionsOverview } from "@/features/admin/flows/expats/AdminSessionsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Funnel Sessions | Syncro Admin"),
    description: t("Track anonymous funnel sessions, answers and conversions."),
  };
};

export default function AdminExpatsSessionsPage() {
  return (
    <AdminLayout>
      <AdminSessionsOverview />
    </AdminLayout>
  );
}
