"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useT } from "../../hooks";
import { Logo } from "@/components/elements/Logo";
import { AuthDesktopVisual } from "@/features/auth/components/AuthDesktopVisual";
import { GoogleAuthButton } from "@/features/auth/components/GoogleAuthButton";

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 text-accent"
    aria-hidden="true"
  >
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
);

const UserIcon = () => (
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
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1.6-3 4-4.5 7-4.5s5.4 1.5 7 4.5" />
  </svg>
);

const LockIcon = () => (
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
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M3 3l18 18" />
    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
    <path d="M9.9 4.2A10.2 10.2 0 0 1 12 4c6.5 0 10 6 10 6a19.8 19.8 0 0 1-4.3 4.9" />
    <path d="M6.2 6.2A19.4 19.4 0 0 0 2 12s3.5 6 10 6a9.8 9.8 0 0 0 4-.8" />
  </svg>
);

const DEV_CREDENTIALS = {
  email: "riccardoc19@gmail.com",
  password: "Dadodado98@",
};

const isLocalhost = (): boolean => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
};

export const Login = () => {
  const router = useRouter();
  const { status, error, isAuthenticated, user, actions } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState(() =>
    isLocalhost() ? DEV_CREDENTIALS.email : "",
  );
  const [password, setPassword] = useState(() =>
    isLocalhost() ? DEV_CREDENTIALS.password : "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    actions.hydrate();
  }, [actions]);

  useEffect(() => {
    if (isAuthenticated && status !== "loading") {
      router.replace("/home");
    }
  }, [isAuthenticated, status, router]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await actions.login({ email, password });
      if (response.requiresVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      } else if (response.authResponse) {
        router.push("/home");
      }
    } catch {}
  };

  const handleGoogleLogin = async (idToken: string) => {
    setGoogleError(null);
    try {
      await actions.loginWithGoogle({ idToken });
      router.push("/home");
    } catch (requestError) {
      const message =
        requestError &&
        typeof requestError === "object" &&
        "message" in requestError &&
        typeof requestError.message === "string"
          ? requestError.message
          : t("Unable to sign in with Google. Try again.");
      setGoogleError(message);
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
              {t("Welcome Back")}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {t("Your matches get smarter every time you return.")}
            </p>

            <ul className="mt-6 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <CheckIcon />
                <span>{t("Smarter matches, not more swipes")}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                <span>{t("Real affinity based on who you are")}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                <span>{t("People, places and experiences aligned with you")}</span>
              </li>
            </ul>

            <div className="mt-6 space-y-4">
              <GoogleAuthButton
                mode="signin"
                disabled={isSubmitting}
                onCredential={handleGoogleLogin}
              />
              {googleError ? (
                <div className="rounded-[12px] border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
                  {googleError}
                </div>
              ) : null}
              <div className="relative py-1 text-center text-xs text-subtle">
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border" />
                <span className="relative bg-white px-3">
                  {t("Or continue with email")}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <UserIcon />
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-[14px] border border-border bg-white px-11 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle"
                  placeholder={t("example@gmail.com")}
                />
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <LockIcon />
                </span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-[14px] border border-border bg-white px-11 py-3 pr-12 text-sm text-foreground shadow-sm placeholder:text-subtle"
                  placeholder={t("enter your password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-subtle hover:text-foreground"
                  aria-label={showPassword ? t("Hide password") : t("Show password")}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div className="-mt-1 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  {t("Forgot password?")}
                </Link>
              </div>

              {error ? (
                <div className="rounded-[12px] border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
                  {error.message}
                </div>
              ) : null}

              {isAuthenticated && user ? (
                <div className="rounded-[12px] border border-border-strong bg-surface px-4 py-2 text-sm text-foreground">
                  {t("You're signed in as {email}.", {
                    email: user.email ?? t("user"),
                  })}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#3f69d0] to-[#3a66d5] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(58,102,213,0.3)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? t("Signing in...") : t("Login")}
              </button>
            </form>

            <div className="mt-6 text-sm text-muted">
              {t("Don't have an account?")}{" "}
              <Link className="font-semibold text-foreground" href="/register">
                {t("Sign up")}
              </Link>
            </div>

            <p className="mt-4 text-xs text-subtle">
              {t("Syncro evolves with you.")}
            </p>
          </div>
        </div>
        <AuthDesktopVisual alt={t("Syncro login visual")} />
      </div>
    </div>
  );
};
