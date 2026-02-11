"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  createUser,
  deleteUser,
  getUserTestsCount,
  getUsers,
  updateUser,
  updateUserPassword,
} from "@/services/admin";
import type { AdminUsersParams } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { UserResponse, UserStatus } from "@/types/auth";
import type { PageResponse } from "@/types/shared";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "SUSPENDED", label: "SUSPENDED" },
  { value: "DELETED", label: "DELETED" },
];

const ONBOARDING_OPTIONS = [
  { value: "", label: "Onboarding: all" },
  { value: "true", label: "Completed" },
  { value: "false", label: "Not completed" },
];

const EDIT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "SUSPENDED", label: "SUSPENDED" },
  { value: "DELETED", label: "DELETED" },
];

const EDIT_ONBOARDING_OPTIONS = [
  { value: "true", label: "Completed" },
  { value: "false", label: "Not completed" },
];

const toneByStatus = (status: UserStatus) => {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "warning" as const;
  return "danger" as const;
};

export const AdminUsersOverview = () => {
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
  const [deleting, setDeleting] = useState(false);
  const [editLanguage, setEditLanguage] = useState("it");
  const [editStatus, setEditStatus] = useState<UserStatus>("ACTIVE");
  const [editOnboarding, setEditOnboarding] = useState("false");
  const [newPassword, setNewPassword] = useState("");
  const [userTestsCount, setUserTestsCount] = useState<number | null>(null);
  const [loadingUserTestsCount, setLoadingUserTestsCount] = useState(false);

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
        status: <Badge tone={toneByStatus(user.status)}>{user.status}</Badge>,
        onboarding: user.onboardingCompleted ? "Completed" : "In progress",
        createdAt: formatDateTime(user.createdAt),
        actions: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedUserId(user.id)}
          >
            Manage
          </Button>
        ),
      }));
  }, [response]);

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
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      return;
    }

    const confirmed = window.confirm(
      "Confirm soft delete for this user?"
    );
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
        title="Application users"
        subtitle="Monitor user accounts, status, and onboarding progress."
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">Create new user</h2>
        <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleCreateUser}>
          <Input
            label="Email"
            type="email"
            value={createEmail}
            onChange={(event) => setCreateEmail(event.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={createPassword}
            onChange={(event) => setCreatePassword(event.target.value)}
            required
          />
          <Input
            label="Language"
            value={createLanguage}
            onChange={(event) => setCreateLanguage(event.target.value)}
            required
          />
          <div className="flex items-end">
            <Button type="submit" size="sm" loading={creating} loadingText="Creating">
              Create user
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
            placeholder="Search by email"
          />
          <Select
            value={statusFilter}
            options={STATUS_OPTIONS}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(0);
            }}
          />
          <Select
            value={onboardingFilter}
            options={ONBOARDING_OPTIONS}
            onValueChange={(value) => {
              setOnboardingFilter(value);
              setPage(0);
            }}
          />
          <Button type="submit" size="sm">
            Apply filters
          </Button>
        </form>
      </Card>

      {selectedUser ? (
        <Card className="space-y-4 border-accent/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Selected user: {selectedUser.email ?? selectedUser.id}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedUserId(null)}>
              Close
            </Button>
          </div>

          <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleUpdateSelectedUser}>
            <Input
              label="Language"
              value={editLanguage}
              onChange={(event) => setEditLanguage(event.target.value)}
              required
            />
            <Select
              label="Status"
              value={editStatus}
              options={EDIT_STATUS_OPTIONS}
              onValueChange={(value) => setEditStatus(value as UserStatus)}
            />
            <Select
              label="Onboarding"
              value={editOnboarding}
              options={EDIT_ONBOARDING_OPTIONS}
              onValueChange={setEditOnboarding}
            />
            <div className="flex items-end">
              <Button type="submit" size="sm" loading={updating} loadingText="Saving">
                Save changes
              </Button>
            </div>
          </form>

          <div className="grid gap-3 lg:grid-cols-[1fr,auto,auto]">
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Minimum 8 characters"
            />
            <div className="flex items-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetPassword}
                loading={resettingPassword}
                loadingText="Resetting"
                disabled={!newPassword.trim()}
              >
                Reset password
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                variant="danger"
                onClick={handleDeleteUser}
                loading={deleting}
                loadingText="Deleting"
              >
                Soft delete user
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <p className="text-sm text-muted">
              Tests completed:{" "}
              <span className="font-semibold text-foreground">
                {loadingUserTestsCount
                  ? "Loading..."
                  : formatNumber(userTestsCount ?? 0)}
              </span>
            </p>
          </Card>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label="Total users"
          value={formatNumber(response?.totalElements ?? 0)}
          trend="neutral"
          trendLabel="Filtered dataset"
        />
        <AdminStatCard
          label="ACTIVE (page)"
          value={formatNumber(activeInPage)}
          trend="neutral"
          trendLabel="Current page count"
        />
        <AdminStatCard
          label="Onboarding completed (page)"
          value={formatNumber(completedInPage)}
          trend="neutral"
          trendLabel="Current page count"
        />
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Loading users...</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Unable to load users</p>
          <p className="text-sm text-muted">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => void loadUsers()}>
            Try again
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "email", label: "Email" },
              { key: "username", label: "Username" },
              { key: "status", label: "Status" },
              { key: "onboarding", label: "Onboarding" },
              { key: "createdAt", label: "Created at" },
              { key: "actions", label: "Actions", align: "right" },
            ]}
            rows={rows}
            emptyLabel="No users found with the current filters"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              Page {(response?.number ?? 0) + 1} of {Math.max(response?.totalPages ?? 1, 1)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={(response?.number ?? 0) <= 0}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={Boolean(response?.last ?? true)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
