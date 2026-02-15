import type { Metadata } from "next";
import { OnboardingStep1 } from "@/features/onboarding/flows/OnboardingStep1";
import { getServerTranslator } from "@/i18n/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  return {
    title: t("Onboarding - Profile | Syncro"),
    description: t("Complete your profile details on Syncro."),
  };
};

export default function OnboardingStep1Page() {
  return <OnboardingStep1 />;
}
