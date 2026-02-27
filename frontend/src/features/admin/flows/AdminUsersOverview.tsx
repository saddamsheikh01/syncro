"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { Select } from "@/components/elements/Select";
import { AdminStatCard } from "@/features/admin/cards/AdminStatCard";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { useT } from "@/hooks";
import {
  createUser,
  deleteUser,
  getUserTestsCount,
  getUsers,
  sendUserPasswordResetLink,
  updateUser,
  updateUserPassword,
} from "@/services/admin";
import type { AdminUsersParams } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { UserResponse, UserStatus } from "@/types/auth";
import type { PageResponse } from "@/types/shared";

const toneByStatus = (status: UserStatus) => {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "warning" as const;
  return "danger" as const;
};

export const AdminUsersOverview = () => {
  const { t } = useT();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [onboardingFilter, setOnboardingFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<PageResponse<UserResponse> | null>(null);

  const [creating, setCreating] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createLanguage, setCreateLanguage] = useState("it");

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSuccess, setResetEmailSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editLanguage, setEditLanguage] = useState("it");
  const [editStatus, setEditStatus] = useState<UserStatus>("ACTIVE");
  const [editOnboarding, setEditOnboarding] = useState("false");
  const [newPassword, setNewPassword] = useState("");
  const [userTestsCount, setUserTestsCount] = useState<number | null>(null);
  const [loadingUserTestsCount, setLoadingUserTestsCount] = useState(false);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("All statuses") },
      { value: "ACTIVE", label: t("ACTIVE") },
      { value: "SUSPENDED", label: t("SUSPENDED") },
      { value: "DELETED", label: t("DELETED") },
    ],
    [t]
  );

  const onboardingOptions = useMemo(
    () => [
      { value: "", label: t("Onboarding: all") },
      { value: "true", label: t("Completed") },
      { value: "false", label: t("Not completed") },
    ],
    [t]
  );

  const editStatusOptions = useMemo(
    () => [
      { value: "ACTIVE", label: t("ACTIVE") },
      { value: "SUSPENDED", label: t("SUSPENDED") },
      { value: "DELETED", label: t("DELETED") },
    ],
    [t]
  );

  const editOnboardingOptions = useMemo(
    () => [
      { value: "true", label: t("Completed") },
      { value: "false", label: t("Not completed") },
    ],
    [t]
  );

  const params = useMemo<AdminUsersParams>(
    () => ({
      email: emailFilter || undefined,
      status: (statusFilter || undefined) as UserStatus | undefined,
      onboardingCompleted:
        onboardingFilter === ""
          ? undefined
          : onboardingFilter === "true",
      page,
      size: 20,
    }),
    [emailFilter, onboardingFilter, page, statusFilter]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await getUsers(params);
      setResponse(next);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const selectedUser = useMemo(
    () => response?.content.find((user) => user.id === selectedUserId) ?? null,
    [response, selectedUserId]
  );

  useEffect(() => {
    if (!selectedUser) {
      setUserTestsCount(null);
      setResetEmailSuccess(null);
      return;
    }

    setEditLanguage(selectedUser.language || "it");
    setEditStatus(selectedUser.status);
    setEditOnboarding(selectedUser.onboardingCompleted ? "true" : "false");

    let isCancelled = false;

    void (async () => {
      setLoadingUserTestsCount(true);
      try {
        const responseCount = await getUserTestsCount(selectedUser.id);
        if (!isCancelled) {
          setUserTestsCount(responseCount.count);
        }
      } catch {
        if (!isCancelled) {
          setUserTestsCount(null);
        }
      } finally {
        if (!isCancelled) {
          setLoadingUserTestsCount(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [selectedUser]);

  const rows = useMemo(() => {
    if (!response?.content.length) {
      return [];
    }

      return response.content.map((user) => ({
        id: user.id,
        email: user.email ?? "-",
        username: user.username ?? "-",
        status: <Badge tone={toneByStatus(user.status)}>{t(user.status)}</Badge>,
        onboarding: user.onboardingCompleted ? t("Completed") : t("In progress"),
        createdAt: formatDateTime(user.createdAt),
        actions: (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/admin/users/${user.id}/analytics`)}
            >
              {t("Analytics")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedUserId(user.id)}
            >
              {t("Manage")}
            </Button>
          </div>
        ),
      }));
  }, [response, router, t]);

  const activeInPage = useMemo(
    () => response?.content.filter((user) => user.status === "ACTIVE").length ?? 0,
    [response]
  );

  const completedInPage = useMemo(
    () => response?.content.filter((user) => user.onboardingCompleted).length ?? 0,
    [response]
  );

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await createUser({
        email: createEmail.trim(),
        password: createPassword,
        language: createLanguage.trim() || "it",
      });
      setCreateEmail("");
      setCreatePassword("");
      setCreateLanguage("it");
      await loadUsers();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSelectedUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      await updateUser(selectedUser.id, {
        language: editLanguage.trim() || "it",
        status: editStatus,
        onboardingCompleted: editOnboarding === "true",
      });
      await loadUsers();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword.trim()) {
      return;
    }

    setResettingPassword(true);
    setError(null);

    try {
      await updateUserPassword(selectedUser.id, {
        newPassword: newPassword.trim(),
      });
      setNewPassword("");
      setResetEmailSuccess(null);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!selectedUser) {
      return;
    }

    setSendingResetEmail(true);
    setError(null);
    setResetEmailSuccess(null);

    try {
      await sendUserPasswordResetLink(selectedUser.id);
      setResetEmailSuccess("Reset email sent successfully.");
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      return;
    }

    const confirmed = window.confirm(t("Confirm soft delete for this user?"));
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteUser(selectedUser.id);
      setSelectedUserId(null);
      await loadUsers();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Application users")}
        subtitle={t("Monitor user accounts, status, and onboarding progress.")}
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Create new user")}
        </h2>
        <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleCreateUser}>
          <Input
            label={t("Email")}
            type="email"
            value={createEmail}
            onChange={(event) => setCreateEmail(event.target.value)}
            required
          />
          <Input
            label={t("Password")}
            type="password"
            value={createPassword}
            onChange={(event) => setCreatePassword(event.target.value)}
            required
          />
          <Input
            label={t("Language")}
            value={createLanguage}
            onChange={(event) => setCreateLanguage(event.target.value)}
            required
          />
          <div className="flex items-end">
            <Button type="submit" size="sm" loading={creating} loadingText={t("Creating")}>
              {t("Create user")}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 p-5">
        <form
          className="grid gap-3 lg:grid-cols-[1fr,220px,220px,auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(0);
            setEmailFilter(query.trim());
          }}
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search by email")}
          />
          <Select
            value={statusFilter}
            options={statusOptions}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(0);
            }}
          />
          <Select
            value={onboardingFilter}
            options={onboardingOptions}
            onValueChange={(value) => {
              setOnboardingFilter(value);
              setPage(0);
            }}
          />
          <Button type="submit" size="sm">
            {t("Apply filters")}
          </Button>
        </form>
      </Card>

      {selectedUser ? (
        <Card className="space-y-4 border-accent/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              {t("Selected user: {user}", {
                user: selectedUser.email ?? selectedUser.id,
              })}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedUserId(null)}>
              {t("Close")}
            </Button>
          </div>

          <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleUpdateSelectedUser}>
            <Input
              label={t("Language")}
              value={editLanguage}
              onChange={(event) => setEditLanguage(event.target.value)}
              required
            />
            <Select
              label={t("Status")}
              value={editStatus}
              options={editStatusOptions}
              onValueChange={(value) => setEditStatus(value as UserStatus)}
            />
            <Select
              label={t("Onboarding")}
              value={editOnboarding}
              options={editOnboardingOptions}
              onValueChange={setEditOnboarding}
            />
            <div className="flex items-end">
              <Button type="submit" size="sm" loading={updating} loadingText={t("Saving")}>
                {t("Save changes")}
              </Button>
            </div>
          </form>

          <div className="grid gap-3 lg:grid-cols-[1fr,auto,auto,auto]">
            <Input
              label={t("New password")}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder={t("Minimum 8 characters")}
            />
            <div className="flex items-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetPassword}
                loading={resettingPassword}
                loadingText={t("Resetting")}
                disabled={!newPassword.trim()}
              >
                {t("Reset password")}
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSendResetEmail}
                loading={sendingResetEmail}
                loadingText={t("Sending...")}
              >
                {t("Send reset email")}
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                variant="danger"
                onClick={handleDeleteUser}
                loading={deleting}
                loadingText={t("Deleting")}
              >
                {t("Soft delete user")}
              </Button>
            </div>
          </div>
          {resetEmailSuccess ? (
            <p className="text-sm text-success">{t(resetEmailSuccess)}</p>
          ) : null}
          {resetEmailSuccess ? (
            <p className="text-xs text-muted">
              {t("If needed, ask the user to check their spam or junk folder.")}
            </p>
          ) : null}

          <Card className="p-4">
            <p className="text-sm text-muted">
              {t("Tests completed")}:{" "}
              <span className="font-semibold text-foreground">
                {loadingUserTestsCount
                  ? t("Loading...")
                  : formatNumber(userTestsCount ?? 0)}
              </span>
            </p>
          </Card>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label={t("Total users")}
          value={formatNumber(response?.totalElements ?? 0)}
          trend="neutral"
          trendLabel={t("Filtered dataset")}
        />
        <AdminStatCard
          label={t("ACTIVE (page)")}
          value={formatNumber(activeInPage)}
          trend="neutral"
          trendLabel={t("Current page count")}
        />
        <AdminStatCard
          label={t("Onboarding completed (page)")}
          value={formatNumber(completedInPage)}
          trend="neutral"
          trendLabel={t("Current page count")}
        />
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading users...")}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">{t("Unable to load users")}</p>
          <p className="text-sm text-muted">{t(error.message)}</p>
          <Button size="sm" variant="outline" onClick={() => void loadUsers()}>
            {t("Try again")}
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "email", label: t("Email") },
              { key: "username", label: t("Username") },
              { key: "status", label: t("Status") },
              { key: "onboarding", label: t("Onboarding") },
              { key: "createdAt", label: t("Created at") },
              { key: "actions", label: t("Actions"), align: "right" },
            ]}
            rows={rows}
            emptyLabel={t("No users found with the current filters")}
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              {t("Page {page} of {total}", {
                page: (response?.number ?? 0) + 1,
                total: Math.max(response?.totalPages ?? 1, 1),
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={(response?.number ?? 0) <= 0}
              >
                {t("Previous")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={Boolean(response?.last ?? true)}
              >
                {t("Next")}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
