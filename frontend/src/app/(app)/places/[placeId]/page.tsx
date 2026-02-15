import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { PlaceDetail } from "@/features/catalog/flows/PlaceDetail";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Place | Syncro"),
    description: t("Place details on Syncro."),
  };
};

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

export default async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId } = await params;

  return (
    <MainLayout>
      <PlaceDetail placeId={placeId} />
    </MainLayout>
  );
}
