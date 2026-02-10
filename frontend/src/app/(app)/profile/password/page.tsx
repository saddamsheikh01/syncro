import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfilePasswordChange } from "@/features/profile/flows/ProfilePasswordChange";

export const metadata: Metadata = {
  title: "Change password | Syncro",
  description: "Update your Syncro account password.",
};

export default function ProfilePasswordPage() {
  return (
    <MainLayout>
      <ProfilePasswordChange />
    </MainLayout>
  );
}
