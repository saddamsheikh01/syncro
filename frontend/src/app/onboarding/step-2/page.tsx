import type { Metadata } from "next";
import { OnboardingStep2 } from "@/features/onboarding/flows/OnboardingStep2";

export const metadata: Metadata = {
  title: "Onboarding - Interessi | Syncro",
  description: "Seleziona gli interessi principali su Syncro.",
};

export default function OnboardingStep2Page() {
  return <OnboardingStep2 />;
}
