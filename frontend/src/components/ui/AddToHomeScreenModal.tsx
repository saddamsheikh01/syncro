"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
    className="h-7 w-7"
    aria-hidden="true"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const MenuDotsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-7 w-7"
    aria-hidden="true"
  >
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
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
    className="h-7 w-7"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative mx-auto flex h-[100px] w-[58px] items-center justify-center rounded-[10px] border-2 border-[#d5ddea] bg-white shadow-sm">
    <div className="absolute inset-x-0 top-[5px] mx-auto h-[3px] w-5 rounded-full bg-[#d5ddea]" />
    <div className="text-[#3b6bdc]">{children}</div>
  </div>
);

interface IllustrationProps {
  phone: React.ReactNode;
  label: string;
}

const Illustration = ({ phone, label }: IllustrationProps) => (
  <div className="flex flex-col items-center gap-2">
    {phone}
    <p className="max-w-[110px] text-center text-[11px] font-medium leading-tight text-foreground">
      {label}
    </p>
  </div>
);

export const AddToHomeScreenModal = () => {
  const { shouldShow, deviceType, dismiss, dismissPermanently } =
    useAddToHomeScreen();
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

  const handlePrimary = () => {
    if (dontShowAgain) {
      dismissPermanently();
    } else {
      dismiss();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="a2hs-title"
      onClick={dismiss}
    >
      <div
        className={cx(
          "relative w-full max-w-md overflow-y-auto rounded-[var(--radius-xl)] border border-border/70 bg-card px-6 pb-6 pt-7 shadow-xl",
          "animate-in slide-in-from-bottom duration-300",
        )}
        style={{ maxHeight: "calc(100dvh - 32px)" }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-muted hover:text-foreground"
          aria-label="Close"
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

        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/new_logosvg.svg"
            alt="Syncro"
            width={160}
            height={40}
            className="h-auto w-[140px]"
            priority
          />
        </div>

        {/* Title */}
        <h2
          id="a2hs-title"
          className="mt-5 text-center text-xl font-bold leading-tight text-[#2f5394] sm:text-2xl"
        >
          Stay Connected, Even When You&apos;re Away.
        </h2>

        {/* Description */}
        <p className="mt-3 text-center text-sm leading-relaxed text-muted">
          Syncro Works Best When It Can Reach You At The Right Moment.
          <br />
          Add It To Your Home Screen And Use It Like An App — No Installation
          Needed.
        </p>

        <p className="mt-4 text-center text-sm font-semibold text-foreground">
          Only Useful Notifications.
        </p>
        <p className="mt-1 text-center text-sm text-muted">
          No Spam. No Noise.
        </p>

        <p className="mt-4 text-center text-sm font-semibold text-foreground">
          Takes Less Than 30 Seconds.
        </p>

        {/* Divider with label */}
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold text-muted">
            It&apos;s Easy:
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Illustrations */}
        <div className="mt-4 flex items-start justify-center gap-4">
          {isIOS ? (
            <>
              <Illustration
                phone={<ShareIcon />}
                label="Tap The Share Icon"
              />
              <Illustration
                phone={<PlusSquareIcon />}
                label="Select Add To Home Screen"
              />
              <Illustration
                phone={
                  <Image
                    src="/new_logosvg.svg"
                    alt=""
                    width={36}
                    height={20}
                    className="h-auto w-[36px]"
                  />
                }
                label="Open Syncro From Home"
              />
            </>
          ) : (
            <>
              <Illustration
                phone={<MenuDotsIcon />}
                label="Tap The Browser Menu ( ⋮ )"
              />
              <Illustration
                phone={<PlusSquareIcon />}
                label="Select Add To Home Screen"
              />
              <Illustration
                phone={
                  <Image
                    src="/new_logosvg.svg"
                    alt=""
                    width={36}
                    height={20}
                    className="h-auto w-[36px]"
                  />
                }
                label="Open Syncro From Home"
              />
            </>
          )}
        </div>

        <p className="mt-3 text-center text-xs text-muted">
          Done In Less Than 30 Sec
        </p>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handlePrimary}
            className="h-12 rounded-[var(--radius-md)] bg-gradient-to-r from-[#325da8] to-[#4fa3df] text-base font-semibold text-white shadow-[0_12px_24px_rgba(56,112,191,0.28)]"
          >
            Add Syncro To Home
          </Button>
          <Button variant="secondary" fullWidth onClick={dismiss}>
            May Be Later
          </Button>
        </div>

        {/* Zyra quote */}
        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          I&apos;ll Only Notify You When Something Is Truly Worth Your
          Attention.
        </p>
        <p className="mt-1 text-center text-xs font-semibold text-accent">
          --- Zyra
        </p>

        {/* Don't show again */}
        <div className="mt-4">
          <Switch
            label="Don't Show Again"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.target.checked)}
          />
        </div>
      </div>
    </div>
  );
};
