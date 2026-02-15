import type { Metadata } from "next";
import { redirect } from "next/navigation";
// import { OnboardingStep4 } from "@/features/onboarding/flows/OnboardingStep4";
import { getServerTranslator } from "@/i18n/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Onboarding - Location | Syncro"),
    description: t("Enable location to complete Syncro onboarding."),
  };
};

// Onboarding semplificato: step 4 disabilitato, redirect a home
// La posizione viene richiesta quando necessario nell'app
export default function OnboardingStep4Page() {
  redirect("/home");
  // return <OnboardingStep4 />;
}
