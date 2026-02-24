import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { ConnectionRequestsOverview } from "@/features/social/flows/ConnectionRequestsOverview";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Connection requests | Syncro"),
    description: t("View, accept or reject connection requests."),
  };
};

export default function ConnectionsPage() {
  return (
    <MainLayout>
      <ConnectionRequestsOverview />
    </MainLayout>
  );
}
