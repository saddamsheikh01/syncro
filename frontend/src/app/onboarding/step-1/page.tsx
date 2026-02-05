import type { Metadata } from "next";
import { OnboardingStep1 } from "@/features/onboarding/flows/OnboardingStep1";

export const metadata: Metadata = {
  title: "Onboarding - Profile | Syncro",
  description: "Complete your profile details on Syncro.",
};

export default function OnboardingStep1Page() {
  return <OnboardingStep1 />;
}
