"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/elements/Card";
import { Button } from "@/components/buttons/Button";
import { useProfileCompletion } from "@/hooks";
import type { CategoryScore } from "@/lib/profileCompletion";

interface Suggestion {
  label: string;
  detail: string;
  href: string;
}

const SUGGESTION_MAP: Record<
  string,
  { label: string; href: string }
> = {
  tests: { label: "Complete Insights", href: "/insights" },
  profile: { label: "Fill Out Profile", href: "/settings#profile" },
  interests: { label: "Select Interests", href: "/settings#interests" },
  avatar: { label: "Add a Photo", href: "/settings#profile" },
  preferences: { label: "Set Preferences", href: "/onboarding/step-3" },
  location: { label: "Enable Location", href: "/settings" },
};

const buildSuggestions = (
  categories: Record<string, CategoryScore>,
): Suggestion[] => {
  const items: Suggestion[] = [];

  for (const [key, score] of Object.entries(categories)) {
    if (score.ratio >= 1) continue;
    const meta = SUGGESTION_MAP[key];
    if (!meta) continue;
    const potential = Math.round(score.weight - score.points);
    if (potential <= 0) continue;
    items.push({
      label: meta.label,
      detail: `+${potential}%`,
      href: meta.href,
    });
  }

  return items
    .sort((a, b) => {
      const aVal = parseInt(a.detail.replace(/[^0-9]/g, ""), 10);
      const bVal = parseInt(b.detail.replace(/[^0-9]/g, ""), 10);
      return bVal - aVal;
    })
    .slice(0, 3);
};

export const OnboardingProgressCard = () => {
  const { percentage, categories } = useProfileCompletion();

  const isComplete = percentage >= 100;

  const suggestions = useMemo(
    () => buildSuggestions(categories),
    [categories],
  );

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
            Profile {percentage}% Complete
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
          style={{ width: `${percentage}%` }}
        />
      </div>

      {suggestions.length > 0 ? (
        <div className="mt-4 border-t border-border/70 pt-4">
          <p className="text-sm font-semibold text-foreground">
            You can improve it with:
          </p>
          <div className="mt-3 space-y-2">
            {suggestions.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-muted"
              >
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
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="flex-1 text-foreground">
                  {item.label}{" "}
                  <span className="text-muted">{item.detail}</span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
};
