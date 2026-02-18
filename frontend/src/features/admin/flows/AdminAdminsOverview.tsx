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
import { useT } from "@/hooks";
import {
  createAdmin,
  deleteAdmin,
  getAdminUsers,
  updateAdmin,
} from "@/services/admin";
import type { AdminAdminsParams } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { AdminRole, AdminStatus, AdminUserResponse } from "@/types/admin";
import type { PageResponse } from "@/types/shared";

const statusTone = (status: AdminStatus) =>
  status === "ACTIVE" ? ("success" as const) : ("warning" as const);

const roleTone = (role: AdminRole) =>
  role === "SUPER_ADMIN" ? ("accent" as const) : ("neutral" as const);

export const AdminAdminsOverview = () => {
  const { t } = useT();

  const [query, setQuery] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<PageResponse<AdminUserResponse> | null>(null);

  const [creating, setCreating] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createRole, setCreateRole] = useState<AdminRole>("ADMIN");

  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AdminStatus>("ACTIVE");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("All statuses") },
      { value: "ACTIVE", label: t("ACTIVE") },
      { value: "SUSPENDED", label: t("SUSPENDED") },
    ],
    [t]
  );

  const roleOptions = useMemo(
    () => [
      { value: "", label: t("All roles") },
      { value: "ADMIN", label: t("ADMIN") },
      { value: "SUPER_ADMIN", label: t("SUPER_ADMIN") },
    ],
    [t]
  );

  const updateStatusOptions = useMemo(
    () => [
      { value: "ACTIVE", label: t("ACTIVE") },
      { value: "SUSPENDED", label: t("SUSPENDED") },
    ],
    [t]
  );

  const createRoleOptions = useMemo(
    () => [
      { value: "ADMIN", label: t("ADMIN") },
      { value: "SUPER_ADMIN", label: t("SUPER_ADMIN") },
    ],
    [t]
  );

  const params = useMemo<AdminAdminsParams>(
    () => ({
      email: emailFilter || undefined,
      status: (statusFilter || undefined) as AdminStatus | undefined,
      role: (roleFilter || undefined) as AdminRole | undefined,
      page,
      size: 20,
    }),
    [emailFilter, page, roleFilter, statusFilter]
  );

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await getAdminUsers(params);
      setResponse(next);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const selectedAdmin = useMemo(
    () => response?.content.find((admin) => admin.id === selectedAdminId) ?? null,
    [response, selectedAdminId]
  );

  useEffect(() => {
    if (!selectedAdmin) {
      return;
    }
    setSelectedStatus(selectedAdmin.status);
  }, [selectedAdmin]);

  const rows = useMemo(() => {
    if (!response?.content.length) {
      return [];
    }

      return response.content.map((admin) => ({
        id: admin.id,
        email: admin.email,
        role: <Badge tone={roleTone(admin.role)}>{t(admin.role)}</Badge>,
        status: <Badge tone={statusTone(admin.status)}>{t(admin.status)}</Badge>,
        lastLogin: admin.lastLogin ? formatDateTime(admin.lastLogin) : "-",
        createdAt: formatDateTime(admin.createdAt),
        actions: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedAdminId(admin.id)}
          >
            {t("Manage")}
          </Button>
        ),
      }));
  }, [response, t]);

  const superAdminsInPage = useMemo(
    () => response?.content.filter((admin) => admin.role === "SUPER_ADMIN").length ?? 0,
    [response]
  );

  const handleCreateAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await createAdmin({
        email: createEmail.trim(),
        password: createPassword,
        role: createRole,
      });
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("ADMIN");
      await loadAdmins();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAdmin) {
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      await updateAdmin(selectedAdmin.id, {
        status: selectedStatus,
      });
      await loadAdmins();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) {
      return;
    }

    const confirmed = window.confirm(t("Confirm deletion for this admin account?"));
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteAdmin(selectedAdmin.id);
      setSelectedAdminId(null);
      await loadAdmins();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Admin users")}
        subtitle={t("Back office access governance with a focus on SUPER_ADMIN roles.")}
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Create new admin")}
        </h2>
        <form
          className="grid gap-3 lg:grid-cols-[1fr,1fr,220px,auto]"
          onSubmit={handleCreateAdmin}
        >
          <Input
            label={t("Email")}
            type="email"
            value={createEmail}
            onChange={(event) => setCreateEmail(event.target.value)}
            required
          />
          <Input
            label={t("Password")}
            type={showCreatePassword ? "text" : "password"}
            value={createPassword}
            onChange={(event) => setCreatePassword(event.target.value)}
            rightSlot={
              <button
                type="button"
                className="text-xs font-semibold text-subtle hover:text-foreground"
                onClick={() => setShowCreatePassword((current) => !current)}
                aria-label={
                  showCreatePassword ? t("Hide password") : t("Show password")
                }
              >
                {showCreatePassword ? t("Hide") : t("Show")}
              </button>
            }
            required
          />
          <Select
            label={t("Role")}
            value={createRole}
            options={createRoleOptions}
            onValueChange={(value) => setCreateRole(value as AdminRole)}
          />
          <div className="flex items-end">
            <Button type="submit" size="sm" loading={creating} loadingText={t("Creating")}>
              {t("Create admin")}
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
            placeholder={t("Search by admin email")}
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
            value={roleFilter}
            options={roleOptions}
            onValueChange={(value) => {
              setRoleFilter(value);
              setPage(0);
            }}
          />
          <Button type="submit" size="sm">
            {t("Apply filters")}
          </Button>
        </form>
      </Card>

      {selectedAdmin ? (
        <Card className="space-y-4 border-accent/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              {t("Selected admin: {email}", { email: selectedAdmin.email })}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedAdminId(null)}>
              {t("Close")}
            </Button>
          </div>

          <form className="grid gap-3 lg:grid-cols-[240px,auto]" onSubmit={handleUpdateAdmin}>
            <Select
              label={t("Status")}
              value={selectedStatus}
              options={updateStatusOptions}
              onValueChange={(value) => setSelectedStatus(value as AdminStatus)}
            />
            <div className="flex items-end gap-2">
              <Button type="submit" size="sm" loading={updating} loadingText={t("Saving")}>
                {t("Save status")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDeleteAdmin}
                loading={deleting}
                loadingText={t("Deleting")}
              >
                {t("Delete admin")}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label={t("Total admins")}
          value={formatNumber(response?.totalElements ?? 0)}
          trend="neutral"
          trendLabel={t("Filtered dataset")}
        />
        <AdminStatCard
          label={t("SUPER_ADMIN (page)")}
          value={formatNumber(superAdminsInPage)}
          trend="neutral"
          trendLabel={t("Current page")}
        />
        <AdminStatCard
          label={t("ACTIVE (page)")}
          value={formatNumber(
            response?.content.filter((admin) => admin.status === "ACTIVE").length ?? 0
          )}
          trend="neutral"
          trendLabel={t("Current page")}
        />
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading admins...")}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">{t("Unable to load admins")}</p>
          <p className="text-sm text-muted">{t(error.message)}</p>
          <Button size="sm" variant="outline" onClick={() => void loadAdmins()}>
            {t("Try again")}
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "email", label: t("Email") },
              { key: "role", label: t("Role") },
              { key: "status", label: t("Status") },
              { key: "lastLogin", label: t("Last login") },
              { key: "createdAt", label: t("Created at") },
              { key: "actions", label: t("Actions"), align: "right" },
            ]}
            rows={rows}
            emptyLabel={t("No admins found with the current filters")}
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
