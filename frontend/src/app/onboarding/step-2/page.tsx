import type { Metadata } from "next";
import { redirect } from "next/navigation";
// import { OnboardingStep2 } from "@/features/onboarding/flows/OnboardingStep2";
import { getServerTranslator } from "@/i18n/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Onboarding - Interests | Syncro"),
    description: t("Select your main interests on Syncro."),
  };
};

// Onboarding semplificato: step 2 disabilitato, redirect a home
// Le passioni possono essere configurate in /settings
export default function OnboardingStep2Page() {
  redirect("/home");
  // return <OnboardingStep2 />;
}
