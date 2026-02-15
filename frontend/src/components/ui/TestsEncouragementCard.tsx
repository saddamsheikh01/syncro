"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { TestCountCard } from "@/components/ui/TestCountCard";
import { useT, useTests } from "@/hooks";

type Translator = (key: string, values?: Record<string, string | number>) => string;

const resolveCtaLabel = (t: Translator, count: number | null | undefined) => {
  if (count == null || count === 0) return t("Start now");
  if (count < 3) return t("Complete another");
  return t("Update your profile");
};

const resolveDescription = (t: Translator, count: number | null | undefined) => {
  if (count == null) return t("Calculating your completed insights.");
  if (count === 0) {
    return t("Unlock your Zyra profile by completing your first insight.");
  }
  if (count < 3) {
    return t("Each insight improves your match accuracy.");
  }
  return t("Keep going: Zyra is refining your profile.");
};

export const TestsEncouragementCard = () => {
  const router = useRouter();
  const { t } = useT();
  const { completedCount, countLoading, actions } = useTests();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchCompletedCount().catch(() => undefined);
  }, [actions]);

  return (
    <TestCountCard
      title={t("Your insights")}
      count={completedCount}
      loading={countLoading}
      description={resolveDescription(t, completedCount)}
      action={
        <Button
          size="sm"
          variant="secondary"
          fullWidth
          onClick={() => router.push("/insights")}
        >
          {resolveCtaLabel(t, completedCount)}
        </Button>
      }
      variant="compact"
    />
  );
};
