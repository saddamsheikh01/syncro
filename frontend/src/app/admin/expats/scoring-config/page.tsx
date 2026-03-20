import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminScoringConfigOverview } from "@/features/admin/flows/expats/AdminScoringConfigOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Scoring config | Syncro Admin"),
    description: t("Relocation scoring configuration."),
  };
};

export default function AdminExpatsScoringConfigPage() {
  return (
    <AdminLayout>
      <AdminScoringConfigOverview />
    </AdminLayout>
  );
}
