import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { SharedPageLayout } from "@/components/layout/SharedPageLayout";
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
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,
    openGraph: {
      type: "website",
      url: profileUrl,
      siteName: "Syncro",
      title: t("Profile on Syncro"),
      description: t("View the public profile of a Syncro user."),
    },
    twitter: {
      card: "summary_large_image",
      title: t("Profile on Syncro"),
      description: t("View the public profile of a Syncro user."),
    },
    alternates: { canonical: profileUrl },
  };

  return metadata;
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return (
    <SharedPageLayout>
      <UserProfileView userId={userId} />
    </SharedPageLayout>
  );
}
