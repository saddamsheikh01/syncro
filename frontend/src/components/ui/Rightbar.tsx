"use client";

import type { HTMLAttributes } from "react";
import { User } from "@/components/elements/User";
import { OnboardingProgressCard } from "@/features/onboarding/cards/OnboardingProgressCard";
import { ZyraTipCard } from "@/components/ui/ZyraTipCard";
import { QuickMatchPreview } from "@/components/ui/QuickMatchPreview";
import { RecentChatsCard } from "@/components/ui/RecentChatsCard";
import { NearbyHighlight } from "@/components/ui/NearbyHighlight";
import { ProfileStatsCard } from "@/components/ui/ProfileStatsCard";
import { cx } from "@/lib/classNames";

export interface RightbarProps extends HTMLAttributes<HTMLElement> {
  position?: "fixed" | "absolute";
}

export const Rightbar = ({
  className,
  position = "fixed",
  ...props
}: RightbarProps) => (
  <aside
    className={cx(
      position,
      "right-4 top-4 bottom-4 z-30 w-[320px]",
      className
    )}
    {...props}
  >
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-[var(--radius-xl)] border border-border/70 bg-surface p-4 shadow-md">
      {/* User profile summary */}
      <User />

      {/* Onboarding progress (hidden when complete) */}
      <OnboardingProgressCard />

      {/* Zyra AI tip */}
      <ZyraTipCard />

      {/* Match of the day preview */}
      <QuickMatchPreview />

      {/* Recent chats */}
      <RecentChatsCard />

      {/* Nearby places/experiences */}
      <NearbyHighlight />

      {/* Profile stats */}
      <ProfileStatsCard />
    </div>
  </aside>
);
