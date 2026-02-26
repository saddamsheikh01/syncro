"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { useAuth, useT } from "@/hooks";
import { requestPasswordReset } from "@/services/auth";

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

export const ProfilePasswordChange = () => {
  const { user } = useAuth();
  const { t } = useT();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSendResetLink = async () => {
    setError(null);
    setSuccessMessage(null);

    const email = user?.email?.trim().toLowerCase();
    if (!email) {
      setError("No email configured on your account. Update your email first.");
      return;
    }

    setSending(true);
    try {
      const response = await requestPasswordReset({ email });
      setSuccessMessage(
        response.message ||
          "If the email is registered, you will receive reset instructions shortly.",
      );
    } catch (submitError) {
      setError(
        resolveErrorMessage(
          submitError,
          "Unable to request password reset. Try again.",
        ),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          {t("Account security")}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("Reset password")}
        </h1>
        <p className="text-sm text-muted">
          {t(
            "We'll send a secure reset link to your account email so you can set a new password."
          )}
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            {t("Destination email")}:{" "}
            <span className="font-medium text-foreground">{user?.email ?? "-"}</span>
          </p>

          {error ? <p className="text-sm text-danger">{t(error)}</p> : null}
          {successMessage ? (
            <p className="text-sm text-success">{t(successMessage)}</p>
          ) : null}
          {successMessage ? (
            <p className="text-xs text-muted">
              {t("If you don't see the email, check your spam or junk folder.")}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              loading={sending}
              loadingText={t("Sending...")}
              onClick={handleSendResetLink}
            >
              {t("Send reset link")}
            </Button>
            <Link
              href="/profile"
              className="text-sm font-medium text-accent hover:underline"
            >
              {t("Back to profile")}
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};
