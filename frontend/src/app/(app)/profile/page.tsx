import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileSettings } from "@/features/profile/flows/ProfileSettings";

export const metadata: Metadata = {
  title: "Profilo | Syncro",
  description: "Gestisci il tuo profilo Syncro.",
};

export default function ProfilePage() {
  return (
    <MainLayout>
      <ProfileSettings />
    </MainLayout>
  );
}
