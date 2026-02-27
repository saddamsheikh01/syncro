import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { UserProfileView } from "@/features/profile/flows/UserProfileView";
import { getSiteUrl } from "@/lib/siteUrl";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const { userId } = await params;
  const baseUrl = getSiteUrl();
  const profileUrl = baseUrl ? `${baseUrl}/profile/${userId}` : `/profile/${userId}`;

  const metadata: Metadata = {
    title: t("User profile | Syncro"),
    description: t("View the public profile of a Syncro user."),
    openGraph: {
      type: "website",
      url: profileUrl,
      siteName: "Syncro",
      title: t("Profile on Syncro"),
      description: t("View the public profile of a Syncro user."),
      images: [{ url: baseUrl ? `${baseUrl}/new_logosvg.svg` : "/new_logosvg.svg", width: 1200, height: 630, alt: "Syncro" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("Profile on Syncro"),
      description: t("View the public profile of a Syncro user."),
      images: [baseUrl ? `${baseUrl}/new_logosvg.svg` : "/new_logosvg.svg"],
    },
    alternates: { canonical: profileUrl },
  };

  if (baseUrl) {
    metadata.metadataBase = new URL(baseUrl);
  }

  return metadata;
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return (
    <MainLayout>
      <UserProfileView userId={userId} />
    </MainLayout>
  );
}
