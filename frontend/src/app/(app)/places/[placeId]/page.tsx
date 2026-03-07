import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { SharedPageLayout } from "@/components/layout/SharedPageLayout";
import { PlaceDetail } from "@/features/catalog/flows/PlaceDetail";
import { getSiteUrl } from "@/lib/siteUrl";

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

export const generateMetadata = async ({
  params,
}: PlaceDetailPageProps): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const { placeId } = await params;
  const baseUrl = getSiteUrl();
  const placeUrl = baseUrl ? `${baseUrl}/places/${placeId}` : `/places/${placeId}`;
  const title = t("Place | Syncro");
  const description = t("Place details on Syncro. Discover places that fit you.");

  return {
    title,
    description,
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,
    openGraph: {
      type: "website",
      url: placeUrl,
      siteName: "Syncro",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: placeUrl },
  };
};

export default async function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId } = await params;

  return (
    <SharedPageLayout>
      <PlaceDetail placeId={placeId} />
    </SharedPageLayout>
  );
}
