import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { UserProfileView } from "@/features/profile/flows/UserProfileView";

export const metadata: Metadata = {
  title: "Profilo utente | Syncro",
  description: "Visualizza il profilo pubblico di un utente Syncro.",
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
