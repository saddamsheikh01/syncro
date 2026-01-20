"use client";

import type { HTMLAttributes } from "react";
import { User } from "@/components/elements/User";
import { OnboardingProgressCard } from "@/features/onboarding/cards/OnboardingProgressCard";
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
      <User />
      <OnboardingProgressCard />
    </div>
  </aside>
);
