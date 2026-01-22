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
import type { ProfileVisibility, UserProfileRequest } from "@/types/profile";

const VISIBILITY_OPTIONS: Array<{
  value: ProfileVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "PUBLIC",
    label: "Pubblico",
    description: "Mostra il tuo profilo completo.",
  },
  {
    value: "PARTIAL",
    label: "Parziale",
    description: "Nasconde alcuni dettagli sensibili.",
  },
  {
    value: "PRIVATE",
    label: "Privato",
    description: "Profilo visibile solo nei match.",
  },
];

export const OnboardingStep1 = () => {
  const router = useRouter();
  const { actions: authActions } = useAuth();
  const { profile, language, loading, error, actions } = useUser();
  const { actions: onboardingActions } = useOnboarding();

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [visibility, setVisibility] = useState<ProfileVisibility>("PUBLIC");
  const [selectedLanguage, setSelectedLanguage] = useState("it");
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
      setFormError("Inserisci il nome completo.");
      return;
    }

    if (!trimmedCity || !trimmedCountry) {
      setFormError("Inserisci citta e paese di residenza.");
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
          : "Errore durante il salvataggio.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <OnboardingStepHeader
          title="Completa il tuo profilo"
          subtitle="Aggiungi i dati principali per personalizzare l'esperienza."
          step={1}
          totalSteps={1}
        />

        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Informazioni di base
            </h3>
            <p className="text-sm text-muted">
              Questi dati ti aiutano a ricevere suggerimenti accurati.
            </p>
          </div>
          <Input
            label="Nome completo"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nome e cognome"
            required
          />
          <DatePicker
            label="Data di nascita"
            value={birthDate}
            onValueChange={setBirthDate}
            placeholder="Seleziona una data"
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
          onValueChange={setSelectedLanguage}
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
            loadingText="Salvataggio"
            onClick={handleContinue}
          >
            Continua
          </Button>
        </div>
      </div>
    </div>
  );
};
