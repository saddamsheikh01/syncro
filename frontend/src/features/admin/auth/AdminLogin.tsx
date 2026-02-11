"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../../hooks/admin/useAdminAuth";
import { Logo } from "@/components/elements/Logo";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/buttons/Button";

export const AdminLogin = () => {
  const router = useRouter();
  const { status, error, isAuthenticated, admin, actions } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    actions.hydrate();
  }, [actions]);

  useEffect(() => {
    if (isAuthenticated && admin) {
      router.replace("/admin/analytics");
    }
  }, [admin, isAuthenticated, router]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await actions.login({ email, password });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center px-6 py-14">
        <div className="mb-10">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft">
            <Logo width={28} className="h-auto w-7" priority />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Admin login
          </h1>
          <p className="mt-2 text-sm text-muted">
            Sign in to the Syncro back office.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="admin-login-email"
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@email.com"
          />

          <Input
            id="admin-login-password"
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
          />

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error.message}
            </div>
          ) : null}

          {isAuthenticated && admin ? (
            <div className="rounded-[var(--radius-md)] border border-border-strong bg-surface px-4 py-3 text-sm text-foreground">
              You are authenticated as {admin.email}.
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingText="Signing in"
          >
            Sign in
          </Button>
        </form>

        <div className="mt-8 text-sm text-muted">
          Need to create an admin?{" "}
          <Link className="font-semibold text-foreground" href="/admin/register">
            Admin registration
          </Link>
        </div>
      </div>
    </div>
  );
};
