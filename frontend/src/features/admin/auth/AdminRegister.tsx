"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "../../../hooks/admin/useAdminAuth";
import type { AdminRole } from "../../../types/admin";
import { Select } from "@/components/elements/Select";

const ADMIN_ROLES: AdminRole[] = ["ADMIN", "SUPER_ADMIN"];
const ADMIN_ROLE_OPTIONS = ADMIN_ROLES.map((roleItem) => ({
  value: roleItem,
  label: roleItem,
}));

export const AdminRegister = () => {
  const { status, error, isAuthenticated, admin, actions } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("ADMIN");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    actions.hydrate();
  }, [actions]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(false);

    try {
      await actions.register(
        { email, password, role },
        bootstrapSecret.trim() ? bootstrapSecret.trim() : undefined
      );
      setSuccess(true);
    } catch {
      setSuccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-6 py-14">
        <div className="mb-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-base font-semibold text-accent">
            S
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Registrazione Admin
          </h1>
          <p className="mt-2 text-sm text-muted">
            Crea un nuovo utente admin per Syncro.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="admin-register-email">
              Email
            </label>
            <input
              id="admin-register-email"
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
            <label className="text-sm font-medium text-foreground" htmlFor="admin-register-password">
              Password
            </label>
            <input
              id="admin-register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle"
              placeholder="Crea una password"
            />
          </div>

          <Select
            label="Ruolo"
            name="role"
            value={role}
            options={ADMIN_ROLE_OPTIONS}
            onValueChange={(nextRole) => setRole(nextRole as AdminRole)}
          />

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="admin-register-bootstrap"
            >
              Bootstrap secret (opzionale)
            </label>
            <input
              id="admin-register-bootstrap"
              name="bootstrapSecret"
              type="text"
              value={bootstrapSecret}
              onChange={(event) => setBootstrapSecret(event.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-subtle"
              placeholder="Solo per la prima creazione"
            />
          </div>

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error.message}
            </div>
          ) : null}

          {success && !error ? (
            <div className="rounded-[var(--radius-md)] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              Admin creato con successo.
            </div>
          ) : null}

          {isAuthenticated && admin ? (
            <div className="rounded-[var(--radius-md)] border border-border-strong bg-surface px-4 py-3 text-sm text-foreground">
              Admin attivo: {admin.email} ({admin.role}).
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-[var(--radius-md)] bg-accent px-4 py-3 text-sm font-semibold text-accent-contrast shadow-md transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Creazione in corso..." : "Crea admin"}
          </button>
        </form>

        <div className="mt-8 text-sm text-muted">
          Hai gia un admin?{" "}
          <Link className="font-semibold text-foreground" href="/admin/login">
            Accedi
          </Link>
        </div>
      </div>
    </div>
  );
};
