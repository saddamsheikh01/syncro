"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Modal } from "@/components/ui/Modal";
import { useAnalytics, useAuth } from "@/hooks";
import { cx } from "@/lib/classNames";
import { submitEarlyAccessFeedback } from "@/services/feedback";
import type { ApiError } from "@/types/api";
import type { EarlyAccessFeedbackChoice } from "@/types/feedback";

type FeedbackChoice = {
  value: EarlyAccessFeedbackChoice;
  label: string;
};

const CHOICES: FeedbackChoice[] = [
  { value: "MORE_RELEVANT_MATCHES", label: "More relevant matches" },
  { value: "MORE_PROFILES", label: "More profiles" },
  { value: "CLEARER_EXPLANATIONS", label: "Clearer explanations" },
  { value: "SOMETHING_ELSE", label: "Something else" },
];

const MIN_DELAY_MS = 60_000;
const MAX_DELAY_MS = 90_000;
const TICK_MS = 1_000;
const ACTIVE_THRESHOLD_MS = 15_000;
const TEXT_MAX = 120;
const CLOSE_AFTER_SUBMIT_MS = 1_000;
const STORAGE_PREFIX = "syncro.early_access_feedback";
const ENABLED =
  (process.env.NEXT_PUBLIC_EARLY_ACCESS_FEEDBACK_ENABLED ?? "true") !== "false";

const buildSentKey = (userId: string) => `${STORAGE_PREFIX}.sent.${userId}`;
const buildDismissedKey = (userId: string) =>
  `${STORAGE_PREFIX}.dismissed.session.${userId}`;

const randomDelayMs = () =>
  MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));

export const EarlyAccessFeedbackModal = () => {
  const { status, user } = useAuth();
  const { actions: analyticsActions } = useAnalytics();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<EarlyAccessFeedbackChoice | null>(null);
  const [otherText, setOtherText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeMsRef = useRef(0);
  const targetMsRef = useRef(randomDelayMs());
  const lastActivityRef = useRef(Date.now());
  const shownRef = useRef(false);

  const canShow = status === "authenticated" && Boolean(user?.id) && ENABLED;
  const userId = user?.id ?? "";

  useEffect(() => {
    if (!canShow) return;
    const sentKey = buildSentKey(userId);
    const dismissedKey = buildDismissedKey(userId);
    if (localStorage.getItem(sentKey) === "1") return;
    if (sessionStorage.getItem(dismissedKey) === "1") return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    updateActivity();
    targetMsRef.current = randomDelayMs();
    activeMsRef.current = 0;
    shownRef.current = false;

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "scroll",
      "click",
      "touchstart",
    ];
    events.forEach((eventName) =>
      window.addEventListener(eventName, updateActivity, { passive: true })
    );

    const timer = window.setInterval(() => {
      if (shownRef.current) return;
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastActivityRef.current > ACTIVE_THRESHOLD_MS) return;

      activeMsRef.current += TICK_MS;
      if (activeMsRef.current >= targetMsRef.current) {
        shownRef.current = true;
        setOpen(true);
      }
    }, TICK_MS);

    return () => {
      window.clearInterval(timer);
      events.forEach((eventName) =>
        window.removeEventListener(eventName, updateActivity)
      );
    };
  }, [canShow, userId]);

  const requiresOtherText = selected === "SOMETHING_ELSE";
  const trimmedOther = otherText.trim();
  const canSubmit = useMemo(() => {
    if (!selected || submitting || submitted) return false;
    if (requiresOtherText && trimmedOther.length === 0) return false;
    return true;
  }, [requiresOtherText, selected, submitting, submitted, trimmedOther.length]);

  const closeWithoutSubmit = useCallback(() => {
    if (!userId) {
      setOpen(false);
      return;
    }
    sessionStorage.setItem(buildDismissedKey(userId), "1");
    setOpen(false);
  }, [userId]);

  const markAsSent = useCallback(() => {
    if (!userId) return;
    localStorage.setItem(buildSentKey(userId), "1");
    setSubmitted(true);
    window.setTimeout(() => {
      setOpen(false);
    }, CLOSE_AFTER_SUBMIT_MS);
  }, [userId]);

  const handleSubmit = async () => {
    if (!selected || !userId) return;
    if (requiresOtherText && trimmedOther.length === 0) return;

    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitEarlyAccessFeedback({
        choice: selected,
        message: requiresOtherText ? trimmedOther : null,
        activeSecondsBeforePrompt: Math.round(activeMsRef.current / 1000),
      });

      await analyticsActions.trackEvent({
        eventType: "FEEDBACK_SUBMITTED",
        payload: {
          choice: selected,
          message: requiresOtherText ? trimmedOther : null,
          active_seconds_before_prompt: Math.round(activeMsRef.current / 1000),
        },
      }).catch(() => undefined);

      markAsSent();
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError?.status === 409) {
        markAsSent();
        return;
      }
      setSubmitError("Unable to send feedback right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={closeWithoutSubmit}
      title={submitted ? "Thank you." : "Early access"}
      description={undefined}
    >
      {submitted ? null : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Syncro is at a very early stage.
            <br />
            It&apos;s essential, incomplete, and in some parts still rough.
            <br />
            We&apos;re testing it this way to understand what really matters.
            <br />
            If you join now and help us improve it with your feedback,
            <br />
            you&apos;ll get access to advanced features as they are released.
          </p>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              What would improve the experience the most right now?
            </p>
            <div className="grid gap-2">
              {CHOICES.map((choice) => {
                const active = selected === choice.value;
                return (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => {
                      setSelected(choice.value);
                      setSubmitError(null);
                    }}
                    className={cx(
                      "rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition",
                      active
                        ? "border-accent/50 bg-accent-soft text-accent"
                        : "border-border/70 bg-surface text-foreground hover:border-border-strong"
                    )}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </div>

          {requiresOtherText ? (
            <div className="space-y-1">
              <textarea
                value={otherText}
                onChange={(event) => setOtherText(event.target.value.slice(0, TEXT_MAX))}
                maxLength={TEXT_MAX}
                rows={3}
                placeholder="Tell us what would help most..."
                className="w-full rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/40"
              />
              <p className="text-right text-[11px] text-subtle">
                {otherText.length}/{TEXT_MAX}
              </p>
            </div>
          ) : null}

          {submitError ? <p className="text-xs text-danger">{submitError}</p> : null}

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit}
              loading={submitting}
              loadingText="Sending..."
            >
              Send feedback · 30 seconds
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
