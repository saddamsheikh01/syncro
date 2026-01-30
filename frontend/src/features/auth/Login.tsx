"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks";
import { Logo } from "@/components/elements/Logo";

const DEV_CREDENTIALS = {
  email: "riccardoc19@gmail.com",
  password: "Dadodado98",
};

const isLocalhost = (): boolean => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
};

export const Login = () => {
  const router = useRouter();
  const { status, error, isAuthenticated, user, actions } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    actions.hydrate();
    if (isLocalhost()) {
      setEmail(DEV_CREDENTIALS.email);
      setPassword(DEV_CREDENTIALS.password);
    }
  }, [actions]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, router]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await actions.login({ email, password });
      router.push("/home");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col justify-center px-6 py-14">
        <div className="mb-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft">
            <Logo width={28} className="h-auto w-7" priority />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Bentornato
          </h1>
          <p className="mt-2 text-sm text-muted">
            Accedi per continuare su Syncro.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="login-email"
            >
              Email
            </label>
            <input
              id="login-email"
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
              htmlFor="login-password"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 pr-14 text-sm text-foreground shadow-sm placeholder:text-subtle"
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-subtle transition hover:text-foreground"
                aria-label={
                  showPassword ? "Nascondi password" : "Mostra password"
                }
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

          {isAuthenticated && user ? (
            <div className="rounded-[var(--radius-md)] border border-border-strong bg-surface px-4 py-3 text-sm text-foreground">
              Sei autenticato come {user.email ?? "utente"}.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-[var(--radius-md)] bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Accesso in corso..." : "Accedi"}
          </button>
        </form>

        <div className="mt-8 text-sm text-muted">
          Non hai un account?{" "}
          <Link className="font-semibold text-foreground" href="/register">
            Registrati
          </Link>
        </div>
      </div>
    </div>
  );
};
