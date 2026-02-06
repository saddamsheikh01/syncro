"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/classNames";
import { Button } from "@/components/buttons/Button";
import { Switch } from "@/components/elements/Switch";
import { useAddToHomeScreen } from "@/hooks/pwa/useAddToHomeScreen";

const ShareIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const PlusSquareIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const MenuDotsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M4 10.5l8-6 8 6" />
    <path d="M6.5 9.5V19h4.5v-5h2v5h4.5V9.5" />
  </svg>
);

interface StepProps {
  number: number;
  icon: React.ReactNode;
  text: string;
}

const Step = ({ number, icon, text }: StepProps) => (
  <div className="flex items-center gap-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent font-semibold">
      {number}
    </div>
    <div className="flex items-center gap-3 text-sm text-foreground">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted text-muted">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  </div>
);

export const AddToHomeScreenModal = () => {
  const { shouldShow, deviceType, dismiss, dismissPermanently } = useAddToHomeScreen();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const handleChange = () => setIsDesktop(media.matches);
    handleChange();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!shouldShow || isDesktop) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [shouldShow, isDesktop, dismiss]);

  useEffect(() => {
    if (shouldShow && !isDesktop) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [shouldShow, isDesktop]);

  if (!shouldShow || isDesktop) return null;

  const isIOS = deviceType === "ios";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm px-4 pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a2hs-title"
      onClick={dismiss}
    >
      <div
        className={cx(
          "w-full max-w-md rounded-[var(--radius-xl)] border border-border/70 bg-card p-6 shadow-xl",
          "animate-in slide-in-from-bottom duration-300"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <HomeIcon />
          </div>
          <h2 id="a2hs-title" className="text-lg font-semibold text-foreground">
            Install Syncro
          </h2>
          <p className="mt-1 text-sm text-muted">
            Add Syncro to your home screen for quick access
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-6">
          {isIOS ? (
            <>
              <Step
                number={1}
                icon={<ShareIcon />}
                text="Tap the Share icon at the bottom"
              />
              <Step
                number={2}
                icon={<PlusSquareIcon />}
                text='Scroll and tap "Add to Home"'
              />
            </>
          ) : (
            <>
              <Step
                number={1}
                icon={<MenuDotsIcon />}
                text="Tap the menu (⋮) in the top right"
              />
              <Step
                number={2}
                icon={<PlusSquareIcon />}
                text='Tap "Add to Home Screen"'
              />
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Switch
            label="Don't show again"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              if (dontShowAgain) {
                dismissPermanently();
              } else {
                dismiss();
              }
            }}
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
};
