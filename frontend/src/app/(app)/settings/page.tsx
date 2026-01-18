import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProfileSettings } from "@/features/profile/flows/ProfileSettings";

export const metadata: Metadata = {
  title: "Impostazioni | Syncro",
  description: "Gestisci le impostazioni del tuo account Syncro.",
};

export default function SettingsPage() {
  return (
    <MainLayout>
      <ProfileSettings
        title="Impostazioni"
        subtitle="Aggiorna i tuoi dati e le preferenze principali."
      />
    </MainLayout>
  );
}
