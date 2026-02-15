import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { Feed } from "@/features/feed/flows/Feed";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Moments | Syncro"),
    description: t("Discover geolocated moments on Syncro."),
  };
};

export default function MomentsPage() {
  return (
    <MainLayout>
      <Feed />
    </MainLayout>
  );
}
