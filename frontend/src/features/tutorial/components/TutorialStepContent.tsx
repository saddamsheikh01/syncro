"use client";

import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import type { TutorialStep, TutorialStepIcon } from "../data/tutorialSteps";

export interface TutorialStepContentProps {
  step: TutorialStep;
  className?: string;
}

const iconColorClasses: Record<TutorialStepIcon, string> = {
  welcome: "bg-gradient-to-br from-zyra-start via-zyra-mid to-zyra-end text-white",
  home: "bg-accent-soft text-accent",
  map: "bg-[var(--qa-map-bg)] text-[var(--qa-map-gradient-start)]",
  match: "bg-[var(--qa-match-bg)] text-[var(--qa-match-gradient-start)]",
  feed: "bg-[var(--qa-feed-bg)] text-[var(--qa-feed-gradient-start)]",
  chat: "bg-[var(--qa-chat-bg)] text-[var(--qa-chat-gradient-start)]",
  tests: "bg-[var(--qa-tests-bg)] text-[var(--qa-tests-gradient-start)]",
  profile: "bg-surface-muted text-foreground",
};

const renderStepIcon = (icon: TutorialStepIcon) => {
  switch (icon) {
    case "welcome":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <path d="M12 3l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6-4.3-4.2 6-.9L12 3z" />
        </svg>
      );
    case "home":
      return <NavIcon name="home" className="h-8 w-8" />;
    case "map":
      return <NavIcon name="map" className="h-8 w-8" />;
    case "match":
      return <NavIcon name="spark" className="h-8 w-8" />;
    case "feed":
      return <NavIcon name="chat" className="h-8 w-8" />;
    case "chat":
      return <NavIcon name="chat" className="h-8 w-8" />;
    case "tests":
      return <NavIcon name="clipboard" className="h-8 w-8" />;
    case "profile":
      return <NavIcon name="user" className="h-8 w-8" />;
    default:
      return <NavIcon name="star" className="h-8 w-8" />;
  }
};

export const TutorialStepContent = ({
  step,
  className,
}: TutorialStepContentProps) => {
  return (
    <div className={cx("flex flex-col items-center text-center", className)}>
      <div
        className={cx(
          "mb-6 flex h-20 w-20 items-center justify-center rounded-[var(--radius-xl)]",
          iconColorClasses[step.icon]
        )}
      >
        {renderStepIcon(step.icon)}
      </div>

      <h3 className="mb-3 text-xl font-semibold text-foreground">
        {step.title}
      </h3>

      <p className="mb-4 text-sm leading-relaxed text-muted">
        {step.description}
      </p>

      {step.highlight ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--qa-tests-border)] bg-[var(--qa-tests-bg)] px-4 py-3">
          <p className="text-xs font-medium text-[var(--qa-tests-gradient-start)]">
            {step.highlight}
          </p>
        </div>
      ) : null}
    </div>
  );
};
