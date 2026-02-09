"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/buttons/Button";
import { Logo } from "@/components/elements/Logo";
import { Switch } from "@/components/elements/Switch";

export interface TutorialModalProps {
  open: boolean;
  onSkip: () => void;
  onClose: () => void;
  onComplete: () => void;
}

export const TutorialModal = ({
  open,
  onSkip,
  onClose,
  onComplete,
}: TutorialModalProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleDismiss = useCallback(() => {
    if (dontShowAgain) {
      onSkip();
    } else {
      onClose();
    }
    setDontShowAgain(false);
  }, [dontShowAgain, onClose, onSkip]);

  const handleSkipAlways = useCallback(() => {
    onSkip();
    setDontShowAgain(false);
  }, [onSkip]);

  const handleGotIt = useCallback(() => {
    onComplete();
    setDontShowAgain(false);
  }, [onComplete]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      } else if (event.key === "Enter") {
        handleGotIt();
      }
    },
    [handleDismiss, handleGotIt],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return;
    }
    document.body.style.overflow = "";
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-[1080px] overflow-hidden rounded-[30px] border border-white/40 bg-white shadow-[0_30px_120px_rgba(8,22,56,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 z-20 rounded-full bg-white/80 p-2 text-[#4d5f86] transition hover:bg-white hover:text-[#1f3f7a]"
          aria-label="Close onboarding"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="grid lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)]">
          <div className="relative z-10 bg-white px-6 py-7 sm:px-10 sm:py-10 lg:px-11">
            <Logo
              width={156}
              className="h-auto w-[130px] sm:w-[150px]"
              priority
            />

            <h2 className="mt-5 text-3xl font-bold leading-tight text-[#2f5394] sm:text-[46px]">
              I&apos;ll Help You Focus On
              <br />
              What Really Fits You.
            </h2>
            <p className="mt-4 max-w-md text-[17px] leading-snug text-[#66748f]">
              Syncro Works Best When It Understands Who You Are.
              <br />
              Help It Read The Right Signals.
            </p>

            <ol className="mt-8 space-y-4">
              {[
                {
                  title: "Complete Your Profile",
                  body: "So We Can Filter Out The Noise And Focus On What Matters To You.",
                },
                {
                  title: "Define Your Affinities",
                  body: "Your Values, Intentions And Lifestyle Shape Every Match.",
                },
                {
                  title: "Avoid Mismatches",
                  body: "People, Places And Experiences That Don't Really Fit You.",
                },
              ].map((item, index, array) => (
                <li key={item.title} className="relative flex gap-4">
                  <div className="relative flex w-8 shrink-0 justify-center">
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#4d84d8] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    {index < array.length - 1 ? (
                      <span className="absolute left-1/2 top-8 h-[46px] -translate-x-1/2 border-l border-dashed border-[#9eb8df]" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-2xl font-semibold leading-tight text-[#2f5394]">
                      {item.title}
                    </p>
                    <p className="mt-1 max-w-md text-[15px] leading-snug text-[#6f7d95]">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 space-y-3">
              <Button
                onClick={handleGotIt}
                className="h-12 w-full rounded-[12px] bg-gradient-to-r from-[#325da8] to-[#4fa3df] text-base font-semibold text-white shadow-[0_16px_30px_rgba(56,112,191,0.32)] hover:brightness-95"
              >
                Got It
              </Button>
              <button
                type="button"
                onClick={handleSkipAlways}
                className="w-full text-center text-sm font-medium text-[#5f6f8d] transition hover:text-[#2f5394]"
              >
                Skip
              </button>
              <p className="text-center text-xs text-[#9aa5b8]">
                Takes Less Than 2 Minutes
              </p>

              <Switch
                checked={dontShowAgain}
                onChange={(event) => setDontShowAgain(event.target.checked)}
                label="Don't Show Again"
                className="border-[#dbe4f4] bg-[#f7f9fe]"
              />
            </div>
          </div>

          <div className="relative hidden min-h-[680px] lg:block">
            <Image
              src="/AI/onboarding.png"
              alt="Zyra onboarding guide"
              fill
              priority
              className="object-cover object-center"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white via-white/65 to-transparent" />

            <div className="absolute bottom-8 left-6 right-6 rounded-[20px] border border-white/60 bg-white/92 p-5 shadow-[0_20px_40px_rgba(23,45,84,0.2)]">
              <p className="text-[32px] font-semibold leading-tight text-[#0f4c87]">
                Follow My Lead.
              </p>
              <p className="mt-2 text-[24px] font-semibold leading-tight text-[#0d1e33]">
                I&apos;ll help you skip mismatches and get better connections.
              </p>
              <p className="mt-3 text-[32px] font-bold leading-none text-[#1a4f93]">
                - Zyra
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
