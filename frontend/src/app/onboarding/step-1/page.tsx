import type { Metadata } from "next";
import { OnboardingStep1 } from "@/features/onboarding/flows/OnboardingStep1";

export const metadata: Metadata = {
  title: "Onboarding - Profilo | Syncro",
  description: "Completa i dati del profilo su Syncro.",
};

export default function OnboardingStep1Page() {
  return <OnboardingStep1 />;
}
