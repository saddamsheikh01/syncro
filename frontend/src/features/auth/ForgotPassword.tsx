"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { Logo } from "@/components/elements/Logo";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { AuthDesktopVisual } from "@/features/auth/components/AuthDesktopVisual";
import { useT } from "@/hooks";
import { requestPasswordReset } from "@/services/auth";

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

export const ForgotPassword = () => {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Email is required.");
      return;
    }

    setSending(true);
    try {
      const response = await requestPasswordReset({ email: normalizedEmail });
      setSuccess(
        response.message ||
          "If the email is registered, you will receive reset instructions shortly.",
      );
    } catch (requestError) {
      setError(
        resolveErrorMessage(
          requestError,
          "Unable to request password reset. Try again.",
        ),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center lg:min-h-[calc(100vh-80px)] lg:grid lg:grid-cols-[minmax(0,500px)_minmax(0,560px)] lg:items-center lg:justify-center lg:gap-10">
        <div className="w-full max-w-[480px] lg:max-w-[500px]">
          <div className="rounded-[28px] border border-[#eef2f8] bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <Logo width={130} className="h-auto w-[120px]" priority />
              <LanguageSwitch variant="full" align="right" />
            </div>
            <h1 className="text-3xl font-semibold text-[#2b4c8f]">
              {t("Reset password")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t(
                "Enter your account email and we will send you a link to set a new password.",
              )}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                id="forgot-password-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-[14px] border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle"
                placeholder={t("Email")}
              />

              {error ? (
                <div className="rounded-[12px] border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
                  {t(error)}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-[12px] border border-success/20 bg-success/10 px-4 py-2 text-sm text-success">
                  {t(success)}
                </div>
              ) : null}
              {success ? (
                <p className="text-xs text-muted">
                  {t("If you don't see the email, check your spam or junk folder.")}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={sending}
                className="mt-2 flex w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#3f69d0] to-[#3a66d5] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(58,102,213,0.3)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? t("Sending...") : t("Send reset link")}
              </button>
            </form>

            <div className="mt-6 text-sm text-muted">
              <Link className="font-semibold text-foreground" href="/login">
                {t("Back to login")}
              </Link>
            </div>
          </div>
        </div>
        <AuthDesktopVisual alt={t("Syncro password reset visual")} />
      </div>
    </div>
  );
};
