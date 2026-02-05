import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { PlaceDetail } from "@/features/catalog/flows/PlaceDetail";

export const metadata: Metadata = {
  title: "Place | Syncro",
  description: "Place details on Syncro.",
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
