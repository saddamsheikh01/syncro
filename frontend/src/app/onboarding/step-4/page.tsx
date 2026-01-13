import type { Metadata } from "next";
import { OnboardingStep4 } from "@/features/onboarding/flows/OnboardingStep4";

export const metadata: Metadata = {
  title: "Onboarding - Posizione | Syncro",
  description: "Abilita la posizione per completare l'onboarding Syncro.",
};

export default function OnboardingStep4Page() {
  return <OnboardingStep4 />;
}
