import type { Metadata } from "next";
import { redirect } from "next/navigation";
// import { OnboardingStep3 } from "@/features/onboarding/flows/OnboardingStep3";

export const metadata: Metadata = {
  title: "Onboarding - Preferenze | Syncro",
  description: "Imposta le preferenze di match e feed su Syncro.",
};

// Onboarding semplificato: step 3 disabilitato, redirect a home
// Le preferenze possono essere configurate in /settings
export default function OnboardingStep3Page() {
  redirect("/home");
  // return <OnboardingStep3 />;
}
