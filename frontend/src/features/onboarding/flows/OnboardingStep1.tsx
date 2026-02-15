"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepHeader } from "@/features/onboarding/sections/OnboardingStepHeader";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { DatePicker } from "@/components/elements/DatePicker";
import { ResidenceField } from "@/features/onboarding/forms/ResidenceField";
import { LanguageSelector } from "@/features/onboarding/forms/LanguageSelector";
import { VisibilitySelector } from "@/features/profile/forms/VisibilitySelector";
import { Button } from "@/components/buttons/Button";
import { useAuth, useOnboarding, useUser } from "@/hooks";
import { useT } from "@/hooks";
import type { ProfileVisibility, UserProfileRequest } from "@/types/profile";

export const OnboardingStep1 = () => {
  const router = useRouter();
  const { actions: authActions } = useAuth();
  const { profile, language, loading, error, actions } = useUser();
  const { actions: onboardingActions } = useOnboarding();
  const { t } = useT();

  const VISIBILITY_OPTIONS: Array<{
    value: ProfileVisibility;
    label: string;
    description: string;
  }> = [
    {
      value: "PUBLIC",
      label: t("onboarding.visibility.public.label"),
      description: t("onboarding.visibility.public.description"),
    },
    {
      value: "PARTIAL",
      label: t("onboarding.visibility.partial.label"),
      description: t("onboarding.visibility.partial.description"),
    },
    {
      value: "PRIVATE",
      label: t("onboarding.visibility.private.label"),
      description: t("onboarding.visibility.private.description"),
    },
  ];

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [visibility, setVisibility] = useState<ProfileVisibility>("PUBLIC");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    authActions.hydrate();
    onboardingActions.setCurrentStep(1);
    actions.hydrateLanguage();
    if (!profile) {
      actions.fetchProfile().catch(() => undefined);
    }
  }, [actions, authActions, onboardingActions, profile]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setBirthDate(profile.birthDate ?? "");
    setCity(profile.city ?? "");
    setCountry(profile.country ?? "");
    setVisibility(profile.visibility ?? "PUBLIC");
  }, [profile]);

  useEffect(() => {
    if (language) {
      setSelectedLanguage(language);
    }
  }, [language]);

  const handleVisibilityToggle = (index: number) => {
    const next = VISIBILITY_OPTIONS[index];
    if (next) {
      setVisibility(next.value);
    }
  };

  const handleContinue = async () => {
    setFormError(null);
    const trimmedName = fullName.trim();
    const trimmedCity = city.trim();
    const trimmedCountry = country.trim();

    if (!trimmedName) {
      setFormError(t("onboarding.step1.fullName.requiredError"));
      return;
    }

    if (!trimmedCity || !trimmedCountry) {
      setFormError(t("onboarding.step1.residence.requiredError"));
      return;
    }

    const payload: UserProfileRequest = {
      fullName: trimmedName,
      birthDate: birthDate || null,
      city: trimmedCity,
      country: trimmedCountry,
      visibility,
    };

    setIsSubmitting(true);
    try {
      await onboardingActions.saveProfile(payload);
      if (selectedLanguage && selectedLanguage !== language) {
        await actions.updateUser({ language: selectedLanguage });
      }
      onboardingActions.completeStep(1);
      // Onboarding semplificato: redirect diretto a home
      // router.push("/onboarding/step-2");
      router.push("/home");
    } catch (submitError) {
      const message =
        submitError && typeof submitError === "object" && "message" in submitError
          ? String((submitError as { message?: string }).message)
          : t("onboarding.step1.saveError");
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <OnboardingStepHeader
          title={t("onboarding.step1.header.title")}
          subtitle={t("onboarding.step1.header.subtitle")}
          step={1}
          totalSteps={1}
        />

        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {t("onboarding.step1.basic.title")}
            </h3>
            <p className="text-sm text-muted">
              {t("onboarding.step1.basic.subtitle")}
            </p>
          </div>
          <Input
            label={t("onboarding.step1.fullName.label")}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder={t("onboarding.step1.fullName.placeholder")}
            required
          />
          <DatePicker
            label={t("onboarding.step1.birthDate.label")}
            value={birthDate}
            onValueChange={setBirthDate}
            placeholder={t("onboarding.step1.birthDate.placeholder")}
            maxYear={new Date().getFullYear()}
          />
        </Card>

        <ResidenceField
          cityValue={city}
          countryValue={country}
          onCityChange={setCity}
          onCountryChange={setCountry}
        />

        <LanguageSelector
          value={selectedLanguage}
          onValueChange={(next) => {
            setSelectedLanguage(next);
            actions.setLanguage(next);
          }}
        />

        <VisibilitySelector
          items={VISIBILITY_OPTIONS.map((option) => ({
            label: option.label,
            description: option.description,
            selected: visibility === option.value,
          }))}
          onItemToggle={handleVisibilityToggle}
        />

        {formError || error ? (
          <Card className="border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">{formError ?? error?.message}</p>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="md"
            loading={isSubmitting || loading}
            loadingText={t("common.saving")}
            onClick={handleContinue}
          >
            {t("common.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
};
