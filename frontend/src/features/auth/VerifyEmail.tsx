"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useT } from "../../hooks";
import { Logo } from "@/components/elements/Logo";
import { AuthDesktopVisual } from "@/features/auth/components/AuthDesktopVisual";

const MailIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 text-subtle"
    aria-hidden="true"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

export const VerifyEmail = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, error, isAuthenticated, actions } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const emailParam = searchParams.get("email")?.trim() ?? "";

  useEffect(() => {
    actions.hydrate();
  }, [actions]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam.toLowerCase());
    }
  }, [emailParam]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim().replace(/\s/g, "");
    if (!normalizedEmail || !normalizedOtp) return;

    try {
      await actions.verifyEmail(normalizedEmail, normalizedOtp);
      router.push("/home");
    } catch {}
  };

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || resendCooldown > 0) return;

    try {
      await actions.resendVerificationOtp(normalizedEmail);
      setResendCooldown(120);
    } catch {}
  };

  if (!emailParam) {
    return (
      <div className="min-h-screen bg-[#f7f9ff] px-6 py-10 flex items-center justify-center">
        <div className="text-center">
          <Logo width={130} className="mx-auto mb-4" />
          <p className="text-muted mb-4">
            {t("Email is required to verify your account.")}
          </p>
          <Link
            href="/login"
            className="font-semibold text-accent hover:underline"
          >
            {t("Back to login")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9ff] px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center lg:min-h-[calc(100vh-80px)] lg:grid lg:grid-cols-[minmax(0,500px)_minmax(0,560px)] lg:items-center lg:justify-center lg:gap-10">
        <div className="w-full max-w-[480px] lg:max-w-[500px]">
          <div className="rounded-[28px] border border-[#eef2f8] bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
            <div className="mb-6">
              <Logo width={130} className="h-auto w-[120px]" priority />
            </div>
            <h1 className="text-3xl font-semibold text-[#2b4c8f]">
              {t("Verify your email")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t("We sent a 6-digit code to {email}. Enter it below.", {
                email: email || emailParam,
              })}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <MailIcon />
                </span>
                <input
                  id="verify-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  readOnly
                  disabled
                  value={email}
                  className="w-full rounded-[14px] border border-border bg-muted/50 px-11 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle cursor-not-allowed"
                  placeholder={t("Email")}
                />
              </div>

              <div>
                <input
                  id="verify-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full rounded-[14px] border border-border bg-white px-4 py-3 text-center text-lg font-semibold tracking-[0.5em] text-foreground shadow-sm placeholder:text-subtle"
                  placeholder="000000"
                />
                <p className="mt-1 text-xs text-subtle">
                  {t("Code expires in 15 minutes.")}
                </p>
              </div>

              {error ? (
                <div className="rounded-[12px] border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
                  {resolveErrorMessage(error, t("Verification failed. Try again."))}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="mt-2 flex w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#3f69d0] to-[#3a66d5] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(58,102,213,0.3)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t("Verifying...") : t("Verify and sign in")}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="text-sm font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
                >
                  {resendCooldown > 0
                    ? t("Resend code in {seconds}s", { seconds: resendCooldown })
                    : t("Resend code")}
                </button>
              </div>
            </form>

            <div className="mt-6 text-sm text-muted">
              {t("Wrong email?")}{" "}
              <Link className="font-semibold text-foreground" href="/login">
                {t("Back to login")}
              </Link>
            </div>
          </div>
        </div>
        <AuthDesktopVisual alt={t("Syncro email verification visual")} />
      </div>
    </div>
  );
};
