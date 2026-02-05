import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { UserProfileView } from "@/features/profile/flows/UserProfileView";

export const metadata: Metadata = {
  title: "User profile | Syncro",
  description: "View the public profile of a Syncro user.",
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
