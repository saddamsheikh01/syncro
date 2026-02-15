"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { useAuth, useT } from "@/hooks";
import { changeCurrentUserPassword } from "@/services/users";
import { resetAllStores } from "@/stores/utils/resetAllStores";

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

export const ProfilePasswordChange = () => {
  const router = useRouter();
  const { actions: authActions } = useAuth();
  const { t } = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setSaving(true);
    try {
      await changeCurrentUserPassword({ currentPassword, newPassword });
      setSuccessMessage("Password updated. Redirecting to login...");
      await authActions.logout();
      resetAllStores();
      router.replace("/login");
    } catch (submitError) {
      setError(resolveErrorMessage(submitError, "Unable to update password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          {t("Account security")}
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          {t("Change password")}
        </h1>
        <p className="text-sm text-muted">
          {t(
            "For security reasons, you will be signed out after saving the new password."
          )}
        </p>
      </div>

      <Card className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label={t("Current password")}
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder={t("Enter current password")}
            required
          />

          <Input
            label={t("New password")}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder={t("At least 8 characters")}
            required
          />

          <Input
            label={t("Confirm new password")}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={t("Repeat new password")}
            required
          />

          {error ? <p className="text-sm text-danger">{t(error)}</p> : null}
          {successMessage ? (
            <p className="text-sm text-success">{t(successMessage)}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" loading={saving} loadingText={t("Saving")}>
              {t("Save new password")}
            </Button>
            <Link
              href="/profile"
              className="text-sm font-medium text-accent hover:underline"
            >
              {t("Back to profile")}
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};
