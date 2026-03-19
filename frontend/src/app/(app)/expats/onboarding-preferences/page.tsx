import { MainLayout } from "@/components/layout/MainLayout";
import OnboardingPreferences from "@/features/expats/onboarding/OnboardingPreferences";

export const metadata = {
  title: "Update Your Preferences – Syncro Expats Mode",
  description: "Refine your relocation profile by answering a few quick questions.",
};

export default function OnboardingPreferencesPage() {
  return (
    <MainLayout>
      <OnboardingPreferences />
    </MainLayout>
  );
}
