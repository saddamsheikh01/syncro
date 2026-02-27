import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { SharedPageLayout } from "@/components/layout/SharedPageLayout";
import { PostDetailView } from "@/features/social/flows/PostDetailView";
import { getSiteUrl } from "@/lib/siteUrl";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const { postId } = await params;
  const baseUrl = getSiteUrl();
  const momentUrl = baseUrl ? `${baseUrl}/moments/${postId}` : `/moments/${postId}`;

  const metadata: Metadata = {
    title: t("Moment | Syncro"),
    description: t("View a shared moment on Syncro."),
    openGraph: {
      type: "website",
      url: momentUrl,
      siteName: "Syncro",
      title: t("Moment on Syncro"),
      description: t("View a shared moment on Syncro."),
      images: [{ url: baseUrl ? `${baseUrl}/new_logosvg.svg` : "/new_logosvg.svg", width: 1200, height: 630, alt: "Syncro" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("Moment on Syncro"),
      description: t("View a shared moment on Syncro."),
      images: [baseUrl ? `${baseUrl}/new_logosvg.svg` : "/new_logosvg.svg"],
    },
    alternates: { canonical: momentUrl },
  };

  if (baseUrl) {
    metadata.metadataBase = new URL(baseUrl);
  }

  return metadata;
};

export default async function MomentDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return (
    <SharedPageLayout>
      <PostDetailView postId={postId} />
    </SharedPageLayout>
  );
}
