import type { Metadata } from "next";
import { OnboardingStep3 } from "@/features/onboarding/flows/OnboardingStep3";

export const metadata: Metadata = {
  title: "Onboarding - Preferenze | Syncro",
  description: "Imposta le preferenze di match e feed su Syncro.",
};

export default function OnboardingStep3Page() {
  return <OnboardingStep3 />;
}
