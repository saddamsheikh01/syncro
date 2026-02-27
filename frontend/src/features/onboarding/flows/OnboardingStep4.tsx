"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStepHeader } from "@/features/onboarding/sections/OnboardingStepHeader";
import { LocationPermissionGate } from "@/features/onboarding/sections/LocationPermissionGate";
import { Card } from "@/components/elements/Card";
import { Button } from "@/components/buttons/Button";
import { useAuth, useOnboarding, usePosition, useT } from "@/hooks";

export const OnboardingStep4 = () => {
  const router = useRouter();
  const { actions: authActions } = useAuth();
  const { position, hasPosition, loading, error, permission, actions } =
    usePosition();
  const { actions: onboardingActions } = useOnboarding();
  const { t } = useT();
  const [localError, setLocalError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    authActions.hydrate();
    onboardingActions.setCurrentStep(4);
    actions.fetchPosition().catch(() => undefined);
  }, [actions, authActions, onboardingActions]);

  const requestPosition = () => {
    setLocalError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocalError(
        t("Geolocation is not available on this device.")
      );
      actions.setPermission("denied");
      return;
    }

    setIsRequesting(true);
    navigator.geolocation.getCurrentPosition(
      async (result) => {
        try {
          actions.setPermission("granted");
          await actions.savePosition({
            latitude: result.coords.latitude,
            longitude: result.coords.longitude,
            accuracyMeters: result.coords.accuracy,
          });
        } catch (saveError) {
          const message =
            saveError && typeof saveError === "object" && "message" in saveError
              ? String((saveError as { message?: string }).message)
              : t("Error while saving location.");
          setLocalError(message);
        } finally {
          setIsRequesting(false);
        }
      },
      () => {
        actions.setPermission("denied");
        setLocalError(t("Location permission denied."));
        setIsRequesting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSecondaryAction = () => {
    actions.setPermission("denied");
    setLocalError(t("Location is required to continue."));
  };

  const handleComplete = async () => {
    if (!hasPosition) {
      setLocalError(t("Location is required to continue."));
      return;
    }

    setIsCompleting(true);
    setLocalError(null);

    try {
      onboardingActions.completeStep(4);
      router.push("/insights");
    } catch (submitError) {
      const message =
        submitError &&
        typeof submitError === "object" &&
        "message" in submitError
          ? String((submitError as { message?: string }).message)
          : t("Error while completing onboarding.");
      setLocalError(message);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <OnboardingStepHeader
          title={t("Share your location")}
          subtitle={t(
            "Precise location is required for nearby suggestions and matches."
          )}
          step={4}
          totalSteps={4}
        />

        {hasPosition ? (
          <Card className="space-y-4 p-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                {t("Location detected")}
              </h3>
              <p className="text-sm text-muted">
                {t("You can update your location at any time.")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface px-4 py-3">
                <p className="text-xs text-subtle">{t("Latitude")}</p>
                <p className="text-sm font-semibold text-foreground">
                  {position?.latitude?.toFixed(5) ?? "-"}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface px-4 py-3">
                <p className="text-xs text-subtle">{t("Longitude")}</p>
                <p className="text-sm font-semibold text-foreground">
                  {position?.longitude?.toFixed(5) ?? "-"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={requestPosition}
              loading={isRequesting}
              loadingText={t("Updating")}
            >
              {t("Update location")}
            </Button>
          </Card>
        ) : (
          <LocationPermissionGate
            primaryActionLabel={t("Allow location")}
            secondaryActionLabel={t("Not now")}
            primaryActionProps={{
              onClick: requestPosition,
              loading: isRequesting,
              loadingText: t("Requesting"),
            }}
            secondaryActionProps={{
              onClick: handleSecondaryAction,
            }}
          />
        )}

        {(localError || error || permission === "denied") && !hasPosition ? (
          <Card className="border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">
              {localError ?? error?.message ?? t("Location is required.")}
            </p>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="md"
            variant="secondary"
            onClick={() => router.push("/onboarding/step-3")}
          >
            {t("Back")}
          </Button>
          <Button
            size="md"
            loading={isCompleting || loading}
            loadingText={t("Completing")}
            onClick={handleComplete}
            disabled={!hasPosition}
          >
            {t("Complete onboarding")}
          </Button>
        </div>
      </div>
    </div>
  );
};
