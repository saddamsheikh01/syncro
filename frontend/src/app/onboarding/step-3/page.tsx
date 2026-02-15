import type { Metadata } from "next";
import { redirect } from "next/navigation";
// import { OnboardingStep3 } from "@/features/onboarding/flows/OnboardingStep3";
import { getServerTranslator } from "@/i18n/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Onboarding - Preferences | Syncro"),
    description: t("Set match and feed preferences on Syncro."),
  };
};

// Onboarding semplificato: step 3 disabilitato, redirect a home
// Le preferenze possono essere configurate in /settings
export default function OnboardingStep3Page() {
  redirect("/home");
  // return <OnboardingStep3 />;
}
