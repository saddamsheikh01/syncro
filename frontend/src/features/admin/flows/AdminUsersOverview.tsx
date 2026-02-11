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
  { value: "", label: "Tutti gli stati" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "SUSPENDED", label: "SUSPENDED" },
  { value: "DELETED", label: "DELETED" },
];

const ONBOARDING_OPTIONS = [
  { value: "", label: "Onboarding: tutti" },
  { value: "true", label: "Completato" },
  { value: "false", label: "Non completato" },
];

const EDIT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "SUSPENDED", label: "SUSPENDED" },
  { value: "DELETED", label: "DELETED" },
];

const EDIT_ONBOARDING_OPTIONS = [
  { value: "true", label: "Completato" },
  { value: "false", label: "Non completato" },
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
      onboarding: user.onboardingCompleted ? "Completato" : "In corso",
      createdAt: formatDateTime(user.createdAt),
      actions: (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedUserId(user.id)}
        >
          Gestisci
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
      "Confermi la disattivazione (soft delete) di questo utente?"
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
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Utenti applicazione</h1>
        <p className="mt-1 text-sm text-muted">
          Monitoraggio utenti, stato account e avanzamento onboarding.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">Crea nuovo utente</h2>
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
            label="Lingua"
            value={createLanguage}
            onChange={(event) => setCreateLanguage(event.target.value)}
            required
          />
          <div className="flex items-end">
            <Button type="submit" size="sm" loading={creating} loadingText="Creazione">
              Crea utente
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
            placeholder="Cerca per email"
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
            Applica filtri
          </Button>
        </form>
      </Card>

      {selectedUser ? (
        <Card className="space-y-4 border-accent/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Gestione utente selezionato: {selectedUser.email ?? selectedUser.id}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedUserId(null)}>
              Chiudi
            </Button>
          </div>

          <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleUpdateSelectedUser}>
            <Input
              label="Lingua"
              value={editLanguage}
              onChange={(event) => setEditLanguage(event.target.value)}
              required
            />
            <Select
              label="Stato"
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
              <Button type="submit" size="sm" loading={updating} loadingText="Salvataggio">
                Salva modifiche
              </Button>
            </div>
          </form>

          <div className="grid gap-3 lg:grid-cols-[1fr,auto,auto]">
            <Input
              label="Nuova password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Minimo 8 caratteri"
            />
            <div className="flex items-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetPassword}
                loading={resettingPassword}
                loadingText="Reset"
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
                loadingText="Eliminazione"
              >
                Soft delete utente
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <p className="text-sm text-muted">
              Test completati:{" "}
              <span className="font-semibold text-foreground">
                {loadingUserTestsCount
                  ? "Caricamento..."
                  : formatNumber(userTestsCount ?? 0)}
              </span>
            </p>
          </Card>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label="Totale utenti"
          value={formatNumber(response?.totalElements ?? 0)}
          trend="neutral"
          trendLabel="Dataset filtrato"
        />
        <AdminStatCard
          label="ACTIVE (pagina)"
          value={formatNumber(activeInPage)}
          trend="neutral"
          trendLabel="Conteggio pagina corrente"
        />
        <AdminStatCard
          label="Onboarding completato (pagina)"
          value={formatNumber(completedInPage)}
          trend="neutral"
          trendLabel="Conteggio pagina corrente"
        />
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Caricamento utenti...</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Errore caricamento utenti</p>
          <p className="text-sm text-muted">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => void loadUsers()}>
            Riprova
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "email", label: "Email" },
              { key: "username", label: "Username" },
              { key: "status", label: "Stato" },
              { key: "onboarding", label: "Onboarding" },
              { key: "createdAt", label: "Creato il" },
              { key: "actions", label: "Azioni", align: "right" },
            ]}
            rows={rows}
            emptyLabel="Nessun utente trovato con i filtri correnti"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              Pagina {(response?.number ?? 0) + 1} di {Math.max(response?.totalPages ?? 1, 1)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(current - 1, 0))}
                disabled={(response?.number ?? 0) <= 0}
              >
                Precedente
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={Boolean(response?.last ?? true)}
              >
                Successiva
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
