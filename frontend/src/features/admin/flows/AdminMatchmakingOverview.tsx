"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { Select } from "@/components/elements/Select";
import { getMatchDomainMeta, MATCH_DOMAIN_ORDER } from "@/lib/matchDomains";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { useT } from "@/hooks";
import {
  getUsers,
  getUserPreferences,
  updateUserMatchmakingPreferences,
} from "@/services/admin";
import type { AdminUsersParams } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { AdminUserPreferencesResponse } from "@/types/admin";
import type { UserResponse, UserStatus } from "@/types/auth";
import type { PageResponse, JsonObject, JsonValue } from "@/types/shared";

type DomainWeightKey =
  | "love"
  | "friendship"
  | "work"
  | "projects"
  | "hobby"
  | "growth";

type DomainWeightForm = Record<DomainWeightKey, string>;

type MatchmakingFormState = {
  ageMin: string;
  ageMax: string;
  distanceKm: string;
  gender: string;
  locationCity: string;
  locationCountry: string;
  geoAvailability: string;
  domainWeights: DomainWeightForm;
};

const DOMAIN_WEIGHT_KEYS: DomainWeightKey[] = [
  "love",
  "friendship",
  "work",
  "projects",
  "hobby",
  "growth",
];

const DEFAULT_DOMAIN_WEIGHTS: DomainWeightForm = {
  love: "1",
  friendship: "1",
  work: "1",
  projects: "1",
  hobby: "1",
  growth: "1",
};

const DEFAULT_FORM_STATE: MatchmakingFormState = {
  ageMin: "",
  ageMax: "",
  distanceKm: "",
  gender: "ANY",
  locationCity: "",
  locationCountry: "",
  geoAvailability: "MIXED",
  domainWeights: DEFAULT_DOMAIN_WEIGHTS,
};

const readNumber = (value: JsonValue | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readString = (value: JsonValue | undefined) =>
  typeof value === "string" ? value : undefined;

const toNullableNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const toWeight = (value: string): number => {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) return 1;
  const intValue = Math.round(parsed);
  return Math.max(0, Math.min(20, intValue));
};

const statusTone = (status: UserStatus) => {
  if (status === "ACTIVE") return "success" as const;
  if (status === "SUSPENDED") return "warning" as const;
  return "danger" as const;
};

const toRecord = (value: JsonValue | undefined): Record<string, JsonValue> => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, JsonValue>;
  }
  return {};
};

export const AdminMatchmakingOverview = () => {
  const { t } = useT();

  const [emailFilter, setEmailFilter] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersResponse, setUsersResponse] = useState<PageResponse<UserResponse> | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<MatchmakingFormState>(DEFAULT_FORM_STATE);
  const [baseFilters, setBaseFilters] = useState<Record<string, JsonValue>>({});
  const [selectedPreferences, setSelectedPreferences] = useState<AdminUserPreferencesResponse | null>(null);

  const matchGenderOptions = useMemo(
    () => [
      { value: "ANY", label: t("Any") },
      { value: "FEMALE", label: t("Women") },
      { value: "MALE", label: t("Men") },
      { value: "NON_BINARY", label: t("Non-binary") },
      { value: "OTHER", label: t("Other") },
    ],
    [t]
  );

  const geoAvailabilityOptions = useMemo(
    () => [
      { value: "MIXED", label: t("Mixed (in-person + remote)") },
      { value: "IN_PERSON", label: t("In person only") },
      { value: "REMOTE", label: t("Remote only") },
    ],
    [t]
  );

  const params = useMemo<AdminUsersParams>(
    () => ({
      email: emailFilter.trim() || undefined,
      page: 0,
      size: 20,
    }),
    [emailFilter]
  );

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);

    try {
      const response = await getUsers(params);
      setUsersResponse(response);
      if (response.content.length === 0) {
        setSelectedUserId(null);
      } else if (
        !selectedUserId ||
        !response.content.some((user) => user.id === selectedUserId)
      ) {
        setSelectedUserId(response.content[0].id);
      }
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoadingUsers(false);
    }
  }, [params, selectedUserId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const selectedUser = useMemo(
    () => usersResponse?.content.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, usersResponse]
  );

  useEffect(() => {
    if (!selectedUserId) {
      setFormState(DEFAULT_FORM_STATE);
      setBaseFilters({});
      setSelectedPreferences(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoadingPreferences(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const response = await getUserPreferences(selectedUserId);
        if (cancelled) return;

        const filters = (response.matchmakingFilters ?? {}) as Record<string, JsonValue>;
        const domainWeightsRaw = toRecord(filters.domainWeights);
        const domainWeights = DOMAIN_WEIGHT_KEYS.reduce<DomainWeightForm>((acc, key) => {
          const value = domainWeightsRaw[key];
          const parsed =
            typeof value === "number" && Number.isFinite(value)
              ? Math.max(0, Math.round(value))
              : 1;
          acc[key] = String(parsed);
          return acc;
        }, { ...DEFAULT_DOMAIN_WEIGHTS });

        setBaseFilters(filters);
        setSelectedPreferences(response);
        setFormState({
          ageMin: readNumber(filters.ageMin)?.toString() ?? "",
          ageMax: readNumber(filters.ageMax)?.toString() ?? "",
          distanceKm: readNumber(filters.distanceKm)?.toString() ?? "",
          gender: readString(filters.gender) ?? "ANY",
          locationCity: readString(filters.locationCity) ?? "",
          locationCountry: readString(filters.locationCountry) ?? "",
          geoAvailability: readString(filters.geoAvailability) ?? "MIXED",
          domainWeights,
        });
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError as ApiError);
        }
      } finally {
        if (!cancelled) {
          setLoadingPreferences(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  const tableRows = useMemo(() => {
    if (!usersResponse?.content.length) return [];

    return usersResponse.content.map((user) => ({
      id: user.id,
      email: user.email ?? "-",
      username: user.username ?? "-",
      status: (
        <Badge tone={statusTone(user.status)}>{t(user.status)}</Badge>
      ),
      onboarding: user.onboardingCompleted ? t("Completed") : t("In progress"),
      action: (
        <Button
          size="sm"
          variant={selectedUserId === user.id ? "secondary" : "outline"}
          onClick={() => setSelectedUserId(user.id)}
        >
          {selectedUserId === user.id ? t("Selected") : t("Configure")}
        </Button>
      ),
    }));
  }, [selectedUserId, t, usersResponse]);

  const handleDomainWeightChange = (key: DomainWeightKey, value: string) => {
    setFormState((prev) => ({
      ...prev,
      domainWeights: {
        ...prev.domainWeights,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedUserId) return;

    setError(null);
    setSuccessMessage(null);

    const ageMin = toNullableNumber(formState.ageMin);
    const ageMax = toNullableNumber(formState.ageMax);
    const distanceKm = toNullableNumber(formState.distanceKm);

    if (ageMin != null && ageMax != null && ageMin > ageMax) {
      setError({
        message: "Minimum age cannot be greater than maximum age.",
      } as ApiError);
      return;
    }
    if (distanceKm != null && distanceKm < 0) {
      setError({
        message: "Distance must be a positive number.",
      } as ApiError);
      return;
    }

    const nextDomainWeights = DOMAIN_WEIGHT_KEYS.reduce<JsonObject>((acc, key) => {
      acc[key] = toWeight(formState.domainWeights[key]);
      return acc;
    }, {});

    const hasPositiveWeight = DOMAIN_WEIGHT_KEYS.some(
      (key) => (nextDomainWeights[key] as number) > 0
    );
    if (!hasPositiveWeight) {
      for (const key of DOMAIN_WEIGHT_KEYS) {
        nextDomainWeights[key] = 1;
      }
    }

    const activeDomains = DOMAIN_WEIGHT_KEYS.reduce<JsonObject>((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});

    const payloadFilters: JsonObject = {
      ...(baseFilters as JsonObject),
      ageMin,
      ageMax,
      distanceKm,
      gender: formState.gender,
      locationCity: formState.locationCity.trim() || null,
      locationCountry: formState.locationCountry.trim() || null,
      geoAvailability: formState.geoAvailability,
      openToNewConnections: true,
      sharedInterests: true,
      activeDomains,
      domainWeights: nextDomainWeights,
    };

    setSavingPreferences(true);
    try {
      const response = await updateUserMatchmakingPreferences(selectedUserId, {
        matchmakingFilters: payloadFilters,
      });
      const updatedFilters = (response.matchmakingFilters ?? {}) as Record<string, JsonValue>;
      setBaseFilters(updatedFilters);
      setSelectedPreferences(response);
      setSuccessMessage("Matchmaking preferences saved.");
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Matchmaking Control")}
        subtitle={t("Manage user-level matchmaking filters and domain weights from the back office.")}
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Select user")}
        </h2>
        <div className="grid gap-3 lg:grid-cols-[1fr,auto]">
          <Input
            label={t("Filter by email")}
            placeholder={t("user@email.com")}
            value={emailFilter}
            onChange={(event) => setEmailFilter(event.target.value)}
          />
          <div className="flex items-end">
            <Button size="sm" variant="secondary" onClick={() => void loadUsers()}>
              {t("Search")}
            </Button>
          </div>
        </div>

        {loadingUsers ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/70 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading users...")}</p>
          </div>
        ) : (
          <AdminTable
            columns={[
              { key: "email", label: t("Email") },
              { key: "username", label: t("Username") },
              { key: "status", label: t("Status") },
              { key: "onboarding", label: t("Onboarding") },
              { key: "action", label: t("Action"), align: "right" },
            ]}
            rows={tableRows}
            emptyLabel={t("No users found with this filter.")}
          />
        )}
      </Card>

      <Card className="space-y-5 p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            {t("Matchmaking settings")}
          </h2>
          <p className="text-sm text-muted">
            {selectedUser
              ? t("Editing: {target}", {
                  target: selectedUser.email ?? selectedUser.id,
                })
              : t("Select a user to edit matchmaking settings.")}
          </p>
        </div>

        {!selectedUser ? null : loadingPreferences ? (
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/70 p-4">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading matchmaking filters...")}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {t("Relocation profile")}
                </p>
                {selectedPreferences?.relocationStatus ? (
                  <Badge tone="neutral">{selectedPreferences.relocationStatus}</Badge>
                ) : (
                  <Badge tone="warning">{t("Not available")}</Badge>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">
                    {t("User type")}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedPreferences?.relocationUserType
                      ? t(selectedPreferences.relocationUserType)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">
                    {t("Target city")}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedPreferences?.relocationTargetCityName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">
                    {t("Current city")}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedPreferences?.relocationCurrentCityName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-subtle">
                    {t("Progress")}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedPreferences?.relocationCompletedSteps != null
                      ? `${selectedPreferences.relocationCompletedSteps}/10 (${selectedPreferences.relocationCompletionPercent ?? 0}%)`
                      : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-subtle">
                {t("This section shows the city data stored in the Sprint 1 relocation profile. Matchmaking filters below remain separate legacy preferences.")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                label={t("Minimum age")}
                type="number"
                min={18}
                value={formState.ageMin}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, ageMin: event.target.value }))
                }
              />
              <Input
                label={t("Maximum age")}
                type="number"
                min={18}
                value={formState.ageMax}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, ageMax: event.target.value }))
                }
              />
              <Input
                label={t("Distance (km)")}
                type="number"
                min={0}
                value={formState.distanceKm}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, distanceKm: event.target.value }))
                }
              />
              <Select
                label={t("Preferred gender")}
                options={matchGenderOptions}
                value={formState.gender}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, gender: value }))
                }
              />
              <Select
                label={t("Geo availability")}
                options={geoAvailabilityOptions}
                value={formState.geoAvailability}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, geoAvailability: value }))
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t("Location city filter")}
                value={formState.locationCity}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, locationCity: event.target.value }))
                }
              />
              <Input
                label={t("Location country filter")}
                value={formState.locationCountry}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, locationCountry: event.target.value }))
                }
              />
            </div>

            <div className="space-y-3 rounded-[var(--radius-md)] border border-border/70 bg-surface-muted/40 p-4">
              <p className="text-sm font-semibold text-foreground">
                {t("Domain weights")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MATCH_DOMAIN_ORDER.map((domain) => {
                  const meta = getMatchDomainMeta(domain);
                  const key = meta.key as DomainWeightKey;
                  return (
                    <Input
                      key={domain}
                      label={`${meta.emoji} ${t(meta.label)}`}
                      type="number"
                      min={0}
                      max={20}
                      value={formState.domainWeights[key]}
                      onChange={(event) =>
                        handleDomainWeightChange(key, event.target.value)
                      }
                    />
                  );
                })}
              </div>
              <p className="text-xs text-subtle">
                {t(
                  "Open to new connections and shared interests boost are always active by product rule."
                )}
              </p>
            </div>

            {error?.message ? (
              <p className="rounded-[var(--radius-md)] border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {t(error.message)}
              </p>
            ) : null}
            {successMessage ? (
              <p className="rounded-[var(--radius-md)] border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                {t(successMessage)}
              </p>
            ) : null}

            <div>
              <Button
                size="sm"
                variant="secondary"
                loading={savingPreferences}
                loadingText={t("Saving")}
                onClick={() => void handleSave()}
              >
                {t("Save matchmaking settings")}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
