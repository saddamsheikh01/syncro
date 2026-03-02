"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAuth, useT } from "@/hooks";

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

export interface EmailVerificationOtpModalProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmailVerificationOtpModal = ({
  open,
  email,
  onClose,
  onSuccess,
}: EmailVerificationOtpModalProps) => {
  const { t } = useT();
  const { status, error, actions } = useAuth();
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!open) {
      setOtp("");
      setResendCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const isSubmitting = status === "loading";
  const normalizedEmail = email.trim().toLowerCase();

  const handleVerify = async () => {
    const normalizedOtp = otp.trim().replace(/\s/g, "");
    if (!normalizedEmail || !normalizedOtp || normalizedOtp.length !== 6) return;

    try {
      await actions.verifyEmailChange(normalizedEmail, normalizedOtp);
      onSuccess();
      onClose();
    } catch {}
  };

  const handleResend = async () => {
    if (!normalizedEmail || resendCooldown > 0) return;
    try {
      await actions.resendEmailChangeOtp(normalizedEmail);
      setResendCooldown(120);
    } catch {}
  };

  return (
    <Modal
      open={open}
      title={t("Verify your email")}
      description={t("We sent a 6-digit code to {email}. Enter it below.", {
        email: normalizedEmail,
      })}
      onClose={onClose}
      primaryAction={{
        label: t("Verify"),
        onClick: handleVerify,
        disabled: otp.length !== 6 || isSubmitting,
        loading: isSubmitting,
        loadingText: t("Verifying..."),
      }}
      secondaryAction={{
        label:
          resendCooldown > 0
            ? t("Resend in {seconds}s", { seconds: resendCooldown })
            : t("Resend code"),
        onClick: handleResend,
        disabled: resendCooldown > 0 || isSubmitting,
      }}
    >
      <div className="space-y-4">
        <div>
          <input
            id="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="w-full rounded-lg border border-border bg-white px-4 py-3 text-center text-lg font-semibold tracking-[0.5em] text-foreground shadow-sm placeholder:text-subtle"
            placeholder="000000"
          />
          <p className="mt-1 text-xs text-subtle">
            {t("Code expires in 15 minutes.")}
          </p>
        </div>
        {error ? (
          <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
            {resolveErrorMessage(error, t("Verification failed. Try again."))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
