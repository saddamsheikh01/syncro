import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileSettings } from "@/features/profile/flows/ProfileSettings";

export const metadata: Metadata = {
  title: "Profile | Syncro",
  description: "Manage your Syncro profile.",
};

export default function ProfilePage() {
  return (
    <MainLayout>
      <ProfileSettings />
    </MainLayout>
  );
}
