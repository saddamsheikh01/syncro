import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { UserProfileView } from "@/features/profile/flows/UserProfileView";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("User profile | Syncro"),
    description: t("View the public profile of a Syncro user."),
  };
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
