"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "../../../hooks/admin/useAdminAuth";
import { Logo } from "@/components/elements/Logo";

export const AdminLogin = () => {
  const { status, error, isAuthenticated, admin, actions } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    actions.hydrate();
  }, [actions]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(false);

    try {
      await actions.login({ email, password });
      setSuccess(true);
    } catch {
      setSuccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-6 py-14">
        <div className="mb-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft">
            <Logo width={28} className="h-auto w-7" priority />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Accesso Admin
          </h1>
          <p className="mt-2 text-sm text-muted">
            Accedi al backoffice Syncro.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="admin-login-email">
              Email
            </label>
            <input
              id="admin-login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle"
              placeholder="admin@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="admin-login-password">
              Password
            </label>
            <input
              id="admin-login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle"
              placeholder="********"
            />
          </div>

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error.message}
            </div>
          ) : null}

          {success && !error ? (
            <div className="rounded-[var(--radius-md)] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              Accesso admin completato.
            </div>
          ) : null}

          {isAuthenticated && admin ? (
            <div className="rounded-[var(--radius-md)] border border-border-strong bg-surface px-4 py-3 text-sm text-foreground">
              Sei autenticato come {admin.email}.
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
          Vuoi creare un admin?{" "}
          <Link className="font-semibold text-foreground" href="/admin/register">
            Registrazione admin
          </Link>
        </div>
      </div>
    </div>
  );
};
