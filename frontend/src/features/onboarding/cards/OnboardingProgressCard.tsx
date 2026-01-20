"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { useAuth, useUser, usePosition, useTags } from "@/hooks";

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
  href?: string;
}

export const OnboardingProgressCard = () => {
  const { status, actions: authActions } = useAuth();
  const { profile, preferences, actions: userActions } = useUser();
  const { hasPosition, actions: positionActions } = usePosition();
  const { interests, actions: tagsActions } = useTags();
  const hydratedRef = useRef(false);

  useEffect(() => {
    authActions.hydrate();
    positionActions.hydrate();
  }, [authActions, positionActions]);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    userActions.fetchProfile().catch(() => undefined);
    userActions.fetchPreferences().catch(() => undefined);
    positionActions.fetchPosition().catch(() => undefined);
    tagsActions.fetchUserInterests().catch(() => undefined);
  }, [status, userActions, positionActions, tagsActions]);

  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        id: "profile",
        label: "Completa il profilo",
        completed: Boolean(profile),
        href: "/onboarding/step-1",
      },
      {
        id: "interests",
        label: "Seleziona interessi",
        completed: Boolean(interests?.tags?.length),
        href: "/onboarding/step-2",
      },
      {
        id: "preferences",
        label: "Imposta preferenze",
        completed: Boolean(preferences),
        href: "/onboarding/step-3",
      },
      {
        id: "position",
        label: "Attiva posizione",
        completed: hasPosition,
        href: "/settings",
      },
    ],
    [profile, interests, preferences, hasPosition]
  );

  const completedCount = steps.filter((step) => step.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const isComplete = completedCount === steps.length;

  if (isComplete) {
    return (
      <Card>
        <CardBody className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M5 12l5 5L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Profilo completato
            </p>
            <p className="text-xs text-muted">Tutte le informazioni sono state inserite</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Completa il profilo
        </h3>
        <span className="text-xs font-semibold text-accent">{progress}%</span>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ul className="space-y-2">
          {steps.map((step) => (
            <li key={step.id}>
              <Link
                href={step.href ?? "#"}
                className={cx(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 transition-colors",
                  step.completed
                    ? "bg-success/10"
                    : "bg-surface-muted hover:bg-surface-muted/80"
                )}
              >
                <div
                  className={cx(
                    "flex h-5 w-5 items-center justify-center rounded-full",
                    step.completed
                      ? "bg-success text-white"
                      : "border-2 border-border"
                  )}
                >
                  {step.completed && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3 w-3"
                    >
                      <path d="M5 12l5 5L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  className={cx(
                    "text-sm",
                    step.completed
                      ? "text-muted line-through"
                      : "font-medium text-foreground"
                  )}
                >
                  {step.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
};
