import type { Metadata } from "next";
import { redirect } from "next/navigation";
// import { OnboardingStep2 } from "@/features/onboarding/flows/OnboardingStep2";

export const metadata: Metadata = {
  title: "Onboarding - Passioni | Syncro",
  description: "Seleziona le passioni principali su Syncro.",
};

// Onboarding semplificato: step 2 disabilitato, redirect a home
// Le passioni possono essere configurate in /settings
export default function OnboardingStep2Page() {
  redirect("/home");
  // return <OnboardingStep2 />;
}
