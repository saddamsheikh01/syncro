"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../../hooks/admin/useAdminAuth";
import type { AdminRole } from "../../../types/admin";
import { Select } from "@/components/elements/Select";
import { Logo } from "@/components/elements/Logo";
import { Input } from "@/components/elements/Input";
import { Button } from "@/components/buttons/Button";
import { useT } from "@/hooks";

const ADMIN_ROLES: AdminRole[] = ["ADMIN", "SUPER_ADMIN"];

export const AdminRegister = () => {
  const { t } = useT();

  const router = useRouter();
  const { status, error, isAuthenticated, admin, actions } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("ADMIN");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    actions.hydrate();
  }, [actions]);

  useEffect(() => {
    if (isAuthenticated && admin) {
      router.replace("/admin/analytics");
    }
  }, [admin, isAuthenticated, router]);

  const isSubmitting = status === "loading";
  const roleOptions = useMemo(
    () =>
      ADMIN_ROLES.map((roleItem) => ({
        value: roleItem,
        label: t(roleItem),
      })),
    [t]
  );

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
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft">
            <Logo width={28} className="h-auto w-7" priority />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t("Admin registration")}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {t("Create a new admin user for Syncro.")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="admin-register-email"
            label={t("Email")}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("admin@email.com")}
          />

          <Input
            id="admin-register-password"
            label={t("Password")}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("Create a password")}
          />

          <Select
            label={t("Role")}
            name="role"
            value={role}
            options={roleOptions}
            onValueChange={(nextRole) => setRole(nextRole as AdminRole)}
          />

          <Input
            id="admin-register-bootstrap"
            label={t("Bootstrap secret (optional)")}
            name="bootstrapSecret"
            type="text"
            value={bootstrapSecret}
            onChange={(event) => setBootstrapSecret(event.target.value)}
            placeholder={t("Only for the first setup")}
          />

          {error ? (
            <div className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {t(error.message)}
            </div>
          ) : null}

          {success && !error ? (
            <div className="rounded-[var(--radius-md)] border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
              {t("Admin created successfully.")}
            </div>
          ) : null}

          {isAuthenticated && admin ? (
            <div className="rounded-[var(--radius-md)] border border-border-strong bg-surface px-4 py-3 text-sm text-foreground">
              {t("Active admin: {email} ({role}).", {
                email: admin.email,
                role: t(admin.role),
              })}
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingText={t("Creating")}
          >
            {t("Create admin")}
          </Button>
        </form>

        <div className="mt-8 text-sm text-muted">
          {t("Already have an admin?")}{" "}
          <Link className="font-semibold text-foreground" href="/admin/login">
            {t("Log in")}
          </Link>
        </div>
      </div>
    </div>
  );
};
