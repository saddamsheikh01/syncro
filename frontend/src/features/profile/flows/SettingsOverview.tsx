"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth, useT, useUser } from "@/hooks";
import {
  checkUsernameAvailability,
  deleteCurrentUser,
} from "@/services/users";
import { requestPasswordReset } from "@/services/auth";
import { resetAllStores } from "@/stores/utils/resetAllStores";

const DELETE_PROFILE_CONFIRMATION_PHRASE = "DELETE MY PROFILE";
const USERNAME_MIN_LENGTH = 3;

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

const normalizeUsername = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "");

export const SettingsOverview = () => {
  const router = useRouter();
  const { t } = useT();
  const { user, actions: authActions } = useAuth();
  const { actions: userActions } = useUser();

  const [accountEmail, setAccountEmail] = useState("");
  const [accountEmailSaving, setAccountEmailSaving] = useState(false);
  const [accountEmailError, setAccountEmailError] = useState<string | null>(null);
  const [accountEmailSuccess, setAccountEmailSuccess] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [passwordResetSending, setPasswordResetSending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const [deleteProfileModalOpen, setDeleteProfileModalOpen] = useState(false);
  const [deleteProfileConfirmation, setDeleteProfileConfirmation] = useState("");
  const [deleteProfileLoading, setDeleteProfileLoading] = useState(false);
  const [deleteProfileError, setDeleteProfileError] = useState<string | null>(null);

  const canConfirmProfileDeletion =
    deleteProfileConfirmation.trim() === DELETE_PROFILE_CONFIRMATION_PHRASE &&
    !deleteProfileLoading;

  useEffect(() => {
    setAccountEmail(user?.email ?? "");
  }, [user?.email]);

  useEffect(() => {
    setUsername(user?.username ?? "");
  }, [user?.username]);

  const normalizedUsername = normalizeUsername(username);
  const currentUsername = normalizeUsername(user?.username ?? "");
  const usernameChanged = normalizedUsername !== currentUsername;
  const usernameValid = normalizedUsername.length >= USERNAME_MIN_LENGTH;

  useEffect(() => {
    if (!usernameChanged) {
      setUsernameAvailable(true);
      setUsernameChecking(false);
      return;
    }
    if (!normalizedUsername || !usernameValid) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }

    let active = true;
    setUsernameChecking(true);
    const timer = setTimeout(() => {
      checkUsernameAvailability(normalizedUsername)
        .then((response) => {
          if (!active) return;
          setUsernameAvailable(Boolean(response.available));
        })
        .catch(() => {
          if (!active) return;
          setUsernameAvailable(null);
        })
        .finally(() => {
          if (!active) return;
          setUsernameChecking(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [normalizedUsername, usernameChanged, usernameValid]);

  const usernameHint = useMemo(() => {
    if (!normalizedUsername) return t("Choose a unique username.");
    if (!usernameValid) {
      return t("Minimum {count} characters.", { count: USERNAME_MIN_LENGTH });
    }
    if (usernameChecking) return t("Checking availability...");
    if (usernameAvailable === true) return t("Username available.");
    if (usernameAvailable === false) return t("Username not available.");
    return t("Checking availability...");
  }, [normalizedUsername, t, usernameAvailable, usernameChecking, usernameValid]);

  const canSaveUsername =
    usernameChanged &&
    usernameValid &&
    usernameAvailable === true &&
    !usernameChecking &&
    !usernameSaving;

  const handleSaveAccountEmail = async () => {
    const trimmed = accountEmail.trim();
    if (!trimmed) {
      setAccountEmailError("Email is required.");
      setAccountEmailSuccess(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setAccountEmailError("Please enter a valid email address.");
      setAccountEmailSuccess(false);
      return;
    }
    if (trimmed === (user?.email ?? "").trim()) {
      setAccountEmailError(null);
      return;
    }

    setAccountEmailSaving(true);
    setAccountEmailError(null);
    setAccountEmailSuccess(false);
    try {
      await userActions.updateUser({ email: trimmed });
      setAccountEmail(trimmed);
      setAccountEmailSuccess(true);
      setTimeout(() => setAccountEmailSuccess(false), 4000);
    } catch (saveError) {
      setAccountEmailError(
        resolveErrorMessage(saveError, "Unable to update email."),
      );
    } finally {
      setAccountEmailSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    setUsernameError(null);
    if (!normalizedUsername) {
      setUsernameError("Enter a valid username.");
      return;
    }
    if (!usernameValid) {
      setUsernameError(
        t("Minimum {count} characters.", { count: USERNAME_MIN_LENGTH }),
      );
      return;
    }
    if (usernameAvailable === false) {
      setUsernameError("Username unavailable.");
      return;
    }

    setUsernameSaving(true);
    try {
      await userActions.updateUser({ username: normalizedUsername });
    } catch (saveError) {
      setUsernameError(resolveErrorMessage(saveError, "Error while saving."));
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleSendPasswordResetLink = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    const email = user?.email?.trim().toLowerCase();
    if (!email) {
      setPasswordError("No email configured on your account.");
      return;
    }

    setPasswordResetSending(true);
    try {
      const response = await requestPasswordReset({ email });
      setPasswordSuccess(
        response.message ||
          "If the email is registered, you will receive reset instructions shortly.",
      );
    } catch (saveError) {
      setPasswordError(
        resolveErrorMessage(saveError, "Unable to request password reset."),
      );
    } finally {
      setPasswordResetSending(false);
    }
  };

  const handleOpenDeleteProfileModal = () => {
    setDeleteProfileError(null);
    setDeleteProfileConfirmation("");
    setDeleteProfileModalOpen(true);
  };

  const handleCloseDeleteProfileModal = () => {
    if (deleteProfileLoading) return;
    setDeleteProfileModalOpen(false);
    setDeleteProfileError(null);
  };

  const handleDeleteProfile = async () => {
    if (!canConfirmProfileDeletion) {
      setDeleteProfileError(
        t('Type "{phrase}" to continue.', {
          phrase: DELETE_PROFILE_CONFIRMATION_PHRASE,
        }),
      );
      return;
    }

    setDeleteProfileLoading(true);
    setDeleteProfileError(null);
    try {
      await deleteCurrentUser({
        confirmationPhrase: deleteProfileConfirmation.trim(),
      });
      resetAllStores();
      authActions.clearSession();
      router.replace("/login");
    } catch (deleteError) {
      setDeleteProfileError(
        resolveErrorMessage(deleteError, "Unable to delete your profile."),
      );
    } finally {
      setDeleteProfileLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            {t("Settings")}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{t("Account")}</h1>
          <p className="text-sm text-muted">
            {t("Manage your Syncro account settings.")}
          </p>
        </div>

        <Card className="space-y-3 p-5">
          <h2 className="text-base font-semibold text-foreground">{t("Profile")}</h2>
          <p className="text-sm text-muted">
            {t("Keep your profile fresh and aligned with your goals.")}
          </p>
          <Link href="/profile">
            <Button size="sm">{t("Go to profile")}</Button>
          </Link>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{t("Email")}</h2>
            <p className="text-sm text-muted">
              {t("Manage your Syncro account settings.")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              label={t("Email")}
              type="email"
              autoComplete="email"
              value={accountEmail}
              onChange={(event) => {
                setAccountEmailError(null);
                setAccountEmailSuccess(false);
                setAccountEmail(event.target.value);
              }}
              error={accountEmailError ? t(accountEmailError) : undefined}
            />
            <div className="flex items-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSaveAccountEmail}
                loading={accountEmailSaving}
                loadingText={t("Saving")}
                disabled={
                  accountEmailSaving ||
                  accountEmail.trim() === (user?.email ?? "").trim()
                }
              >
                {t("Save")}
              </Button>
            </div>
          </div>
          {accountEmailSuccess ? (
            <p className="text-sm text-success">
              {t("Email updated successfully.")}
            </p>
          ) : null}
        </Card>

        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{t("Username")}</h2>
            <p className="text-sm text-muted">{usernameHint}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <Input
              label={t("Username")}
              value={username}
              onChange={(event) => {
                setUsernameError(null);
                setUsername(event.target.value);
              }}
            />
            <div className="flex items-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSaveUsername}
                loading={usernameSaving}
                loadingText={t("Saving")}
                disabled={!canSaveUsername}
              >
                {t("Save username")}
              </Button>
            </div>
          </div>
          {usernameError ? (
            <p className="text-sm text-danger">{t(usernameError)}</p>
          ) : null}
        </Card>

        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{t("Password")}</h2>
            <p className="text-sm text-muted">
              {t(
                "For security, password changes happen through a reset link sent to your email."
              )}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {t("Destination email")}:{" "}
              <span className="font-medium text-foreground">{user?.email ?? "-"}</span>
            </p>
            {passwordError ? (
              <p className="text-sm text-danger">{t(passwordError)}</p>
            ) : null}
            {passwordSuccess ? (
              <p className="text-sm text-success">{t(passwordSuccess)}</p>
            ) : null}
            {passwordSuccess ? (
              <p className="text-xs text-muted">
                {t("If you don't see the email, check your spam or junk folder.")}
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              loading={passwordResetSending}
              loadingText={t("Sending...")}
              disabled={passwordResetSending}
              onClick={handleSendPasswordResetLink}
            >
              {t("Send reset link")}
            </Button>
          </div>
        </Card>

        <Card className="space-y-4 border-danger/30 bg-danger/5 p-5">
          <h2 className="text-base font-semibold text-danger">{t("Danger zone")}</h2>
          <p className="text-sm text-danger/90">
            {t("Deleting your profile is permanent and cannot be undone.")}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="danger"
              onClick={handleOpenDeleteProfileModal}
            >
              {t("Delete profile")}
            </Button>
            <p className="text-xs text-danger/80">
              {t("You will need to type a confirmation phrase.")}
            </p>
          </div>
        </Card>
      </div>

      <Modal
        open={deleteProfileModalOpen}
        onClose={handleCloseDeleteProfileModal}
        title={t("Delete profile")}
        description={t("Deleting your profile is permanent and cannot be undone.")}
        primaryAction={{
          label: t("Delete profile"),
          onClick: () => {
            void handleDeleteProfile();
          },
          variant: "danger",
          loading: deleteProfileLoading,
          loadingText: t("Deleting"),
          disabled: !canConfirmProfileDeletion,
        }}
        secondaryAction={{
          label: t("Cancel"),
          onClick: handleCloseDeleteProfileModal,
          variant: "secondary",
          disabled: deleteProfileLoading,
        }}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Type this phrase exactly:
            {" "}
            <span className="font-semibold text-foreground">
              {DELETE_PROFILE_CONFIRMATION_PHRASE}
            </span>
          </p>
          <Input
            label={t("Delete profile")}
            value={deleteProfileConfirmation}
            onChange={(event) => {
              setDeleteProfileError(null);
              setDeleteProfileConfirmation(event.target.value);
            }}
            placeholder={DELETE_PROFILE_CONFIRMATION_PHRASE}
            autoComplete="off"
          />
          {deleteProfileError ? (
            <p className="text-sm text-danger">{t(deleteProfileError)}</p>
          ) : null}
        </div>
      </Modal>
    </>
  );
};
