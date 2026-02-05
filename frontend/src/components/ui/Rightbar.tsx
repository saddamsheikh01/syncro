"use client";

import type { HTMLAttributes } from "react";
import { ZyraTipCard } from "@/components/ui/ZyraTipCard";
import { QuickMatchPreview } from "@/components/ui/QuickMatchPreview";
import { RecentChatsCard } from "@/components/ui/RecentChatsCard";
import { NearbyHighlight } from "@/components/ui/NearbyHighlight";
import { RightbarMatchSummary } from "@/components/ui/RightbarMatchSummary";
import { RightbarStatusCard } from "@/components/ui/RightbarStatusCard";
import { RightbarTodayCard } from "@/components/ui/RightbarTodayCard";
import { RightbarShortcutsCard } from "@/components/ui/RightbarShortcutsCard";
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
    className={cx(position, "right-4 top-4 bottom-4 z-30 w-[320px]", className)}
    {...props}
  >
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-[var(--radius-xl)] border border-border/70 bg-surface p-4 shadow-md">
      <ZyraTipCard />

      <RecentChatsCard />

      <QuickMatchPreview />

      <RightbarMatchSummary />

      <NearbyHighlight />

      <RightbarStatusCard />

      <RightbarTodayCard />

      <RightbarShortcutsCard />
    </div>
  </aside>
);
