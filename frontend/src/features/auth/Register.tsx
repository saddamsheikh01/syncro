"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAnalytics, useAuth } from "../../hooks";

export const Register = () => {
  const router = useRouter();
  const { status, error, isAuthenticated, user, actions } = useAuth();
  const { actions: analyticsActions } = useAnalytics();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    actions.hydrate();
  }, [actions]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(false);

    try {
      await actions.register({ email, password });
      setSuccess(true);
      analyticsActions.trackEvent({ eventType: "USER_REGISTERED" }).catch(() => undefined);
      router.push("/onboarding/step-1");
    } catch {
      setSuccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col justify-center px-6 py-14">
        <div className="mb-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-base font-semibold text-accent">
            S
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Crea il tuo account
          </h1>
          <p className="mt-2 text-sm text-muted">
            Registrati per iniziare il tuo percorso su Syncro.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle"
              placeholder="nome@email.com"
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="signup-password"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 pr-14 text-sm text-foreground shadow-sm placeholder:text-subtle"
                placeholder="Crea una password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-subtle transition hover:text-foreground"
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                aria-pressed={showPassword}
              >
                {showPassword ? "Nascondi" : "Mostra"}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error.message}
            </div>
          ) : null}

          {success && !error ? (
            <div className="rounded-[var(--radius-md)] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              Registrazione completata.
            </div>
          ) : null}

          {isAuthenticated && user ? (
            <div className="rounded-[var(--radius-md)] border border-border-strong bg-surface px-4 py-3 text-sm text-foreground">
              Account attivo per {user.email ?? "utente"}.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-[var(--radius-md)] bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Registrazione in corso..." : "Registrati"}
          </button>
        </form>

        <div className="mt-8 text-sm text-muted">
          Hai gia un account?{" "}
          <Link className="font-semibold text-foreground" href="/login">
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
};
