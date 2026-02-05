import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileSettings } from "@/features/profile/flows/ProfileSettings";

export const metadata: Metadata = {
  title: "Settings | Syncro",
  description: "Manage your Syncro account settings.",
};

export default function SettingsPage() {
  return (
    <MainLayout>
      <ProfileSettings
        title="Settings"
        subtitle="Update your details and main preferences."
      />
    </MainLayout>
  );
}
