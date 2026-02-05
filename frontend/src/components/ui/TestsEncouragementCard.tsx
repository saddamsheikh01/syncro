"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { TestCountCard } from "@/components/ui/TestCountCard";
import { useTests } from "@/hooks";

const resolveCtaLabel = (count: number | null | undefined) => {
  if (count == null || count === 0) return "Start now";
  if (count < 3) return "Complete another";
  return "Update your profile";
};

const resolveDescription = (count: number | null | undefined) => {
  if (count == null) return "Calculating your completed insights.";
  if (count === 0) {
    return "Unlock your Zyra profile by completing your first insight.";
  }
  if (count < 3) {
    return "Each insight improves your match accuracy.";
  }
  return "Keep going: Zyra is refining your profile.";
};

export const TestsEncouragementCard = () => {
  const router = useRouter();
  const { completedCount, countLoading, actions } = useTests();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchCompletedCount().catch(() => undefined);
  }, [actions]);

  return (
    <TestCountCard
      title="Your insights"
      count={completedCount}
      loading={countLoading}
      description={resolveDescription(completedCount)}
      action={
        <Button
          size="sm"
          variant="secondary"
          fullWidth
          onClick={() => router.push("/insights")}
        >
          {resolveCtaLabel(completedCount)}
        </Button>
      }
      variant="compact"
    />
  );
};
