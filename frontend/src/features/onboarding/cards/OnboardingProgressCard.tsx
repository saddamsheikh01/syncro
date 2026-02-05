"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/elements/Card";
import { Button } from "@/components/buttons/Button";
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
        label: "Complete your profile",
        completed: Boolean(profile),
        href: "/settings",
      },
      {
        id: "interests",
        label: "Select interests",
        completed: Boolean(interests?.tags?.length),
        href: "/settings",
      },
      {
        id: "preferences",
        label: "Set preferences",
        completed: Boolean(preferences),
        href: "/settings",
      },
      {
        id: "position",
        label: "Enable location",
        completed: hasPosition,
        href: "/settings",
      },
    ],
    [profile, interests, preferences, hasPosition]
  );

  const completedCount = steps.filter((step) => step.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const isComplete = completedCount === steps.length;

  const suggestions = [
    { label: "Values Test", detail: "(3 min) +20% reliability" },
    { label: "Personal Profile", detail: "(5 min) +15% affinity" },
  ];

  if (isComplete) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success text-white">
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
              Profile completed
            </p>
            <p className="text-xs text-muted">
              All required information has been filled in.
            </p>
          </div>
          <Link href="/insights">
            <Button size="sm">Profile Insights</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-foreground">
            Profile {progress}% Complete
          </p>
          <p className="mt-1 text-sm text-muted">
            Complete your profile to get more accurate matches.
          </p>
        </div>
        <Link href="/insights">
          <Button size="sm">Profile Insights</Button>
        </Link>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 border-t border-border/70 pt-4">
        <p className="text-sm font-semibold text-foreground">
          You can improve it with:
        </p>
        <div className="mt-3 space-y-2">
          {suggestions.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <path d="M5 12l5 5L19 7" />
                </svg>
              </span>
              <span className="text-foreground">
                {item.label}{" "}
                <span className="text-muted">{item.detail}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
