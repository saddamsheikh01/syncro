"use client";

import Link from "next/link";
import { AstrologyBirthChartCard } from "@/features/profile/cards/AstrologyBirthChartCard";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { useT, useUser, useTests } from "@/hooks";

export const AstrologyInsightRunner = () => {
  const { t } = useT();
  const { profile, actions: userActions } = useUser();
  const { actions: testsActions } = useTests();

  const handleSaved = () => {
    userActions.fetchProfile();
    testsActions.fetchCompletedCount();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <SectionHeader
        title={t("Birth chart")}
        subtitle={t("Used for compatibility. Add place and optional time for better accuracy.")}
      />

      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/profile#insights"
          className="text-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          ← {t("Back to profile")}
        </Link>
      </div>

      <AstrologyBirthChartCard
        initialBirthDate={profile?.birthDate ?? undefined}
        initialInterpretation={profile?.zyraBirthChartInterpretation ?? undefined}
        onSaved={handleSaved}
      />
    </div>
  );
};
