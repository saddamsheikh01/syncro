"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/elements/Card";
import { Button } from "@/components/buttons/Button";
import { useProfileCompletion, useT } from "@/hooks";
import type { CategoryScore } from "@/lib/profileCompletion";

interface Suggestion {
  id: string;
  label: string;
  detail: string;
  href: string;
}

const SUGGESTION_MAP: Record<
  string,
  { labelKey: string; href: string }
> = {
  profilePhoto: { labelKey: "Add a profile photo", href: "/profile#profile" },
  profileFields: { labelKey: "Fill out profile (birth date, location)", href: "/profile#profile" },
  userName: { labelKey: "Add your name", href: "/settings#profile" },
  interests: { labelKey: "Select at least 3 interests", href: "/profile#interests" },
  insights: { labelKey: "Complete Insights (tests and birth chart)", href: "/profile#insights" },
};

const buildSuggestions = (
  t: (key: string, values?: Record<string, string | number>) => string,
  categories: Record<string, CategoryScore>,
): Suggestion[] => {
  const totalItems = Object.values(categories).reduce((sum, c) => sum + c.weight, 0);
  if (totalItems <= 0) return [];

  const rawItems: { id: string; label: string; potentialPercent: number; href: string }[] = [];

  for (const [key, score] of Object.entries(categories)) {
    if (score.ratio >= 1) continue;
    const meta = SUGGESTION_MAP[key];
    if (!meta) continue;
    const missingPoints = score.weight - score.points;
    if (missingPoints <= 0) continue;
    const potentialPercent = Math.round((missingPoints / totalItems) * 100);
    rawItems.push({
      id: key,
      label: t(meta.labelKey),
      potentialPercent,
      href: meta.href,
    });
  }

  return rawItems
    .sort((a, b) => b.potentialPercent - a.potentialPercent)
    .map((item) => ({
      id: item.id,
      label: item.label,
      detail: `+${item.potentialPercent}%`,
      href: item.href,
    }));
};

export const OnboardingProgressCard = () => {
  const { t } = useT();
  const { percentage: rawPercentage, categories, loading } = useProfileCompletion();
  const percentage = Math.min(100, Math.max(0, Math.round(rawPercentage ?? 0)));

  const isComplete = percentage >= 100;

  const suggestions = useMemo(
    () => buildSuggestions(t, categories),
    [categories, t],
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
              {t("Profile completed")}
            </p>
            <p className="text-xs text-muted">
              {t("All required information has been filled in.")}
            </p>
          </div>
          <Link href="/profile#insights">
            <Button size="sm">{t("Profile Insights")}</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {t("Loading profile…")}
            </p>
            <p className="mt-1 text-sm text-muted">
              {t("Complete your profile to get more accurate matches.")}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted/80 animate-pulse" />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-foreground">
            {t("Profile {percentage}% Complete", { percentage })}
          </p>
          <p className="mt-1 text-sm text-muted">
            {t("Complete your profile to get more accurate matches.")}
          </p>
        </div>
        <Link href="/profile#insights">
          <Button size="sm">{t("Profile Insights")}</Button>
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
            {t("You can improve it with:")}
          </p>
          <div className="mt-3 space-y-2">
            {suggestions.map((item) => (
              <Link
                key={item.id}
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
