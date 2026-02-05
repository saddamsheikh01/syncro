"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepHeader } from "@/features/onboarding/sections/OnboardingStepHeader";
import { InterestPickerGrid } from "@/features/onboarding/forms/InterestPickerGrid";
import { SelectedTagsRow } from "@/features/tags/lists/SelectedTagsRow";
import { Card } from "@/components/elements/Card";
import { Button } from "@/components/buttons/Button";
import { useAuth, useOnboarding, useTags } from "@/hooks";

const MIN_SELECTIONS = 3;

export const OnboardingStep2 = () => {
  const router = useRouter();
  const { actions: authActions } = useAuth();
  const { tags, interests, loading, error, actions } = useTags();
  const { actions: onboardingActions } = useOnboarding();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    authActions.hydrate();
    onboardingActions.setCurrentStep(2);
    actions.fetchTags().catch(() => undefined);
    actions.fetchUserInterests().catch(() => undefined);
  }, [actions, authActions, onboardingActions]);

  useEffect(() => {
    if (initializedRef.current) return;
    if (!interests) return;
    setSelectedIds(interests.tags.map((tag) => tag.id));
    initializedRef.current = true;
  }, [interests]);

  const selectedCount = selectedIds.length;
  const hasMinSelection = selectedCount >= MIN_SELECTIONS;

  const interestItems = useMemo(
    () =>
      tags.map((tag) => ({
        id: tag.id,
        label: tag.name,
        selected: selectedIds.includes(tag.id),
      })),
    [tags, selectedIds]
  );

  const selectedTags = useMemo(
    () =>
      tags
        .filter((tag) => selectedIds.includes(tag.id))
        .map((tag) => ({ id: tag.id, label: tag.name, tone: "accent" as const })),
    [tags, selectedIds]
  );

  const handleToggle = (id: string, nextSelected: boolean) => {
    setFormError(null);
    setSelectedIds((prev) =>
      nextSelected ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleContinue = async () => {
    setFormError(null);

    if (!hasMinSelection) {
      setFormError(`Select at least ${MIN_SELECTIONS} interests.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onboardingActions.updateUserInterests({ tagIds: selectedIds });
      onboardingActions.completeStep(2);
      router.push("/onboarding/step-3");
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
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <OnboardingStepHeader
          title="Select your interests"
          subtitle="Choose the topics that best represent you."
          step={2}
          totalSteps={3}
        />

        <InterestPickerGrid
          items={interestItems}
          hint={`Select at least ${MIN_SELECTIONS} interests to continue.`}
          onItemToggle={handleToggle}
        />

        {selectedTags.length ? (
          <Card className="p-5">
            <SelectedTagsRow title="Selected" items={selectedTags} />
          </Card>
        ) : null}

        {formError || error ? (
          <Card className="border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">{formError ?? error?.message}</p>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="md"
            variant="secondary"
            onClick={() => router.push("/onboarding/step-1")}
          >
            Back
          </Button>
          <Button
            size="md"
            loading={isSubmitting || loading}
            loadingText="Saving"
            onClick={handleContinue}
            disabled={!hasMinSelection}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
