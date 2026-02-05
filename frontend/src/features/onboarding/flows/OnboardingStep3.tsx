"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepHeader } from "@/features/onboarding/sections/OnboardingStepHeader";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import { Switch } from "@/components/elements/Switch";
import { Button } from "@/components/buttons/Button";
import { useAuth, useOnboarding, usePreferences } from "@/hooks";
import type { JsonObject, JsonValue } from "@/types/shared";

const GENDER_OPTIONS = [
  { value: "ANY", label: "Any" },
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NON_BINARY", label: "Non-binary" },
];

const readNumber = (value: JsonValue | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readBoolean = (value: JsonValue | undefined) =>
  typeof value === "boolean" ? value : undefined;

const readString = (value: JsonValue | undefined) =>
  typeof value === "string" ? value : undefined;

const toNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export const OnboardingStep3 = () => {
  const router = useRouter();
  const { actions: authActions } = useAuth();
  const { preferences, loading, error, actions } = usePreferences();
  const { actions: onboardingActions } = useOnboarding();
  const initializedRef = useRef(false);

  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [gender, setGender] = useState("ANY");
  const [sharedInterests, setSharedInterests] = useState(true);
  const [feedRadiusKm, setFeedRadiusKm] = useState("");
  const [feedOnlyNearby, setFeedOnlyNearby] = useState(true);
  const [feedAutoTranslate, setFeedAutoTranslate] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    authActions.hydrate();
    onboardingActions.setCurrentStep(3);
    actions.fetchPreferences().catch(() => undefined);
  }, [actions, authActions, onboardingActions]);

  useEffect(() => {
    if (initializedRef.current || !preferences) return;
    const storedFilters = (preferences.matchmakingFilters ?? {}) as Record<
      string,
      JsonValue
    >;
    const storedFeed = (preferences.feedPreferences ?? {}) as Record<string, JsonValue>;

    setAgeMin(readNumber(storedFilters.ageMin)?.toString() ?? "");
    setAgeMax(readNumber(storedFilters.ageMax)?.toString() ?? "");
    setDistanceKm(readNumber(storedFilters.distanceKm)?.toString() ?? "");
    setGender(readString(storedFilters.gender) ?? "ANY");
    setSharedInterests(readBoolean(storedFilters.sharedInterests) ?? true);

    setFeedRadiusKm(readNumber(storedFeed.radiusKm)?.toString() ?? "");
    setFeedOnlyNearby(readBoolean(storedFeed.onlyNearby) ?? true);
    setFeedAutoTranslate(readBoolean(storedFeed.autoTranslate) ?? true);

    initializedRef.current = true;
  }, [preferences]);

  const handleContinue = async () => {
    setFormError(null);

    const minAgeValue = toNumber(ageMin);
    const maxAgeValue = toNumber(ageMax);
    const distanceValue = toNumber(distanceKm);
    const feedRadiusValue = toNumber(feedRadiusKm);

    if (minAgeValue !== null && maxAgeValue !== null && minAgeValue > maxAgeValue) {
      setFormError("Minimum age cannot be greater than maximum age.");
      return;
    }

    if ((distanceValue ?? 0) < 0 || (feedRadiusValue ?? 0) < 0) {
      setFormError("Enter positive values for distances.");
      return;
    }

    const matchmakingFilters: JsonObject = {
      ageMin: minAgeValue,
      ageMax: maxAgeValue,
      distanceKm: distanceValue,
      gender,
      sharedInterests,
    };

    const feedPreferences: JsonObject = {
      radiusKm: feedRadiusValue,
      onlyNearby: feedOnlyNearby,
      autoTranslate: feedAutoTranslate,
    };

    setIsSubmitting(true);
    try {
      await onboardingActions.savePreferences({
        matchmakingFilters,
        feedPreferences,
      });
      onboardingActions.completeStep(3);
      router.push("/home");
    } catch (submitError) {
      const message =
        submitError && typeof submitError === "object" && "message" in submitError
          ? String((submitError as { message?: string }).message)
          : "Error while saving.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <OnboardingStepHeader
          title="Set your preferences"
          subtitle="Configure preferences for personalized matches and feed."
          step={3}
          totalSteps={3}
        />

        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Matchmaking preferences
            </h3>
            <p className="text-sm text-muted">
              Define the main filters for your matches.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Minimum age"
              type="number"
              min={18}
              value={ageMin}
              onChange={(event) => setAgeMin(event.target.value)}
              placeholder="18"
            />
            <Input
              label="Maximum age"
              type="number"
              min={18}
              value={ageMax}
              onChange={(event) => setAgeMax(event.target.value)}
              placeholder="45"
            />
          </div>
          <Input
            label="Maximum distance (km)"
            type="number"
            min={1}
            value={distanceKm}
            onChange={(event) => setDistanceKm(event.target.value)}
            placeholder="25"
          />
          <Select
            label="Gender"
            options={GENDER_OPTIONS}
            value={gender}
            onValueChange={setGender}
          />
          <Switch
            label="Shared interests"
            description="Prioritize people who share your tags."
            checked={sharedInterests}
            onChange={(event) => setSharedInterests(event.target.checked)}
          />
        </Card>

        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Feed preferences
            </h3>
            <p className="text-sm text-muted">
              Control how posts near you are shown.
            </p>
          </div>
          <Input
            label="Feed radius (km)"
            type="number"
            min={1}
            value={feedRadiusKm}
            onChange={(event) => setFeedRadiusKm(event.target.value)}
            placeholder="10"
          />
          <Switch
            label="Show only nearby content"
            description="Hide posts outside the selected radius."
            checked={feedOnlyNearby}
            onChange={(event) => setFeedOnlyNearby(event.target.checked)}
          />
          <Switch
            label="Auto-translate content"
            description="Automatically translate content."
            checked={feedAutoTranslate}
            onChange={(event) => setFeedAutoTranslate(event.target.checked)}
          />
        </Card>

        {formError || error ? (
          <Card className="border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">{formError ?? error?.message}</p>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="md"
            variant="secondary"
            onClick={() => router.push("/onboarding/step-2")}
          >
            Back
          </Button>
          <Button
            size="md"
            loading={isSubmitting || loading}
            loadingText="Saving"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
