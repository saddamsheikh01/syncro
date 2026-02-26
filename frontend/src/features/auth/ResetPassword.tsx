"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Logo } from "@/components/elements/Logo";
import { AuthDesktopVisual } from "@/features/auth/components/AuthDesktopVisual";
import { useT } from "@/hooks";
import { confirmPasswordReset } from "@/services/auth";

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

export const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("Password reset token is missing.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await confirmPasswordReset({ token, newPassword });
      setSuccess(true);
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch (requestError) {
      setError(
        resolveErrorMessage(
          requestError,
          "Unable to reset password. Request a new link and try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center lg:min-h-[calc(100vh-80px)] lg:grid lg:grid-cols-[minmax(0,500px)_minmax(0,560px)] lg:items-center lg:justify-center lg:gap-10">
        <div className="w-full max-w-[480px] lg:max-w-[500px]">
          <div className="rounded-[28px] border border-[#eef2f8] bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
            <div className="mb-6">
              <Logo width={130} className="h-auto w-[120px]" priority />
            </div>
            <h1 className="text-3xl font-semibold text-[#2b4c8f]">
              {t("Reset password")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t("Set your new password to complete account recovery.")}
            </p>

            {!token ? (
              <div className="mt-6 rounded-[12px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                {t("The reset link is invalid or incomplete.")}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                id="reset-password-new"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-[14px] border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle"
                placeholder={t("New password")}
                disabled={!token || saving || success}
              />

              <input
                id="reset-password-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-[14px] border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle"
                placeholder={t("Confirm new password")}
                disabled={!token || saving || success}
              />

              {error ? (
                <div className="rounded-[12px] border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
                  {t(error)}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-[12px] border border-success/20 bg-success/10 px-4 py-2 text-sm text-success">
                  {t("Password updated. Redirecting to login...")}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!token || saving || success}
                className="mt-2 flex w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#3f69d0] to-[#3a66d5] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(58,102,213,0.3)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? t("Saving") : t("Save new password")}
              </button>
            </form>

            <div className="mt-6 text-sm text-muted">
              <Link className="font-semibold text-foreground" href="/login">
                {t("Back to login")}
              </Link>
            </div>
          </div>
        </div>
        <AuthDesktopVisual alt={t("Syncro new password visual")} />
      </div>
    </div>
  );
};
