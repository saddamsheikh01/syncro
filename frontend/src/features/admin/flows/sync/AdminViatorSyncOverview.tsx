"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Checkbox } from "@/components/elements/Checkbox";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { formatNumber } from "@/features/admin/lib/formatters";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import {
  createViatorDestinationRef,
  deleteViatorDestinationRef,
  getViatorSyncStatus,
  listViatorDestinationRefs,
  syncViatorProducts,
  updateViatorDestinationRef,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  ViatorDestinationRefResponse,
  ViatorSyncResponse,
  ViatorSyncStatusResponse,
} from "@/types/admin";
import { useT } from "@/hooks";

const parseOptionalInteger = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.round(parsed);
};

const toIsoDateTimeOrNull = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const toDateTimeLocal = (value: string | null): string => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const AdminViatorSyncOverview = () => {
  const DEFAULT_COUNT = 20;
  const { t } = useT();
  const [status, setStatus] = useState<ViatorSyncStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [destinationSaving, setDestinationSaving] = useState(false);
  const [destinationBusyId, setDestinationBusyId] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<ViatorDestinationRefResponse[]>([]);

  const [lastResult, setLastResult] = useState<ViatorSyncResponse | null>(null);

  const [count, setCount] = useState("");
  const [maxPages, setMaxPages] = useState("5");
  const [language, setLanguage] = useState("en-US");
  const [modifiedSince, setModifiedSince] = useState("");
  const [resetCursor, setResetCursor] = useState(false);
  const [newDestinationRef, setNewDestinationRef] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("100");
  const [newEnabled, setNewEnabled] = useState(true);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    setError(null);

    try {
      const response = await getViatorSyncStatus();
      setStatus(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const loadDestinations = useCallback(async () => {
    setDestinationsLoading(true);
    setError(null);

    try {
      const response = await listViatorDestinationRefs();
      setDestinations(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDestinationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadStatus(), loadDestinations()]);
  }, [loadStatus, loadDestinations]);

  const handleSyncProducts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRunning(true);
    setError(null);

    try {
      const response = await syncViatorProducts({
        count: parseOptionalInteger(count) ?? DEFAULT_COUNT,
        maxPages: parseOptionalInteger(maxPages),
        modifiedSince: toIsoDateTimeOrNull(modifiedSince),
        resetCursor,
        language: language.trim() || null,
      });
      setLastResult(response);
      setModifiedSince(toDateTimeLocal(response.effectiveModifiedSince));
      await loadStatus();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setRunning(false);
    }
  };

  const handleCreateDestination = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const destinationRef = newDestinationRef.trim();
    if (!destinationRef) {
      setError({
        code: "UNKNOWN",
        status: 400,
        message: t("Destination code is required"),
      });
      return;
    }

    setDestinationSaving(true);
    setError(null);

    try {
      await createViatorDestinationRef({
        destinationRef,
        cityName: newCityName.trim() || null,
        sortOrder: parseOptionalInteger(newSortOrder) ?? 100,
        enabled: newEnabled,
      });
      setNewDestinationRef("");
      setNewCityName("");
      setNewSortOrder("100");
      setNewEnabled(true);
      await Promise.all([loadDestinations(), loadStatus()]);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDestinationSaving(false);
    }
  };

  const handleToggleDestination = async (destination: ViatorDestinationRefResponse) => {
    setDestinationBusyId(destination.id);
    setError(null);

    try {
      await updateViatorDestinationRef(destination.id, {
        enabled: !destination.enabled,
      });
      await Promise.all([loadDestinations(), loadStatus()]);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDestinationBusyId(null);
    }
  };

  const handleDeleteDestination = async (destination: ViatorDestinationRefResponse) => {
    const confirmed = window.confirm(t("Delete destination code {code}?", { code: destination.destinationRef }));
    if (!confirmed) {
      return;
    }

    setDestinationBusyId(destination.id);
    setError(null);

    try {
      await deleteViatorDestinationRef(destination.id);
      await Promise.all([loadDestinations(), loadStatus()]);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDestinationBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Viator Sync")}
        subtitle={t("Sync experiences from Viator Partner API.")}
      />

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">
            {t("Integration status")}
          </h2>
          <Button size="sm" variant="outline" onClick={() => void loadStatus()}>
            {t("Refresh status")}
          </Button>
        </div>

        {statusLoading ? (
          <div className="flex items-center gap-3">
            <Loader size="sm" />
            <p className="text-sm text-muted">
              {t("Checking Viator configuration...")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">
              {t("Configured:")}
            </span>{" "}
            {status?.configured ? t("YES") : t("NO")}
            {" · "}
            {status?.message ?? t("N/A")}
          </p>
        )}
        {!statusLoading ? (
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">
              {t("Configured destinations:")}
            </span>{" "}
            {formatNumber(status?.configuredDestinationCount ?? 0)}
          </p>
        ) : null}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Destination codes")}
        </h2>

        <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleCreateDestination}>
          <Input
            label={t("Destination code")}
            value={newDestinationRef}
            placeholder="511"
            onChange={(event) => setNewDestinationRef(event.target.value)}
          />
          <Input
            label={t("City name (optional)")}
            value={newCityName}
            placeholder={t("Milan")}
            onChange={(event) => setNewCityName(event.target.value)}
          />
          <Input
            label={t("Sort order")}
            value={newSortOrder}
            onChange={(event) => setNewSortOrder(event.target.value)}
          />
          <div className="flex items-end gap-3">
            <Checkbox
              label={t("Enabled")}
              checked={newEnabled}
              onChange={(event) => setNewEnabled(event.target.checked)}
            />
            <Button
              type="submit"
              size="sm"
              loading={destinationSaving}
              loadingText="Saving"
            >
              {t("Add code")}
            </Button>
          </div>
        </form>

        {destinationsLoading ? (
          <div className="flex items-center gap-3">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading destination codes...")}</p>
          </div>
        ) : destinations.length === 0 ? (
          <p className="text-sm text-muted">{t("No destination codes configured.")}</p>
        ) : (
          <div className="space-y-2">
            {destinations.map((destination) => {
              const rowBusy = destinationBusyId === destination.id;
              return (
                <div
                  key={destination.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface px-4 py-3"
                >
                  <div className="flex min-w-[220px] flex-col">
                    <p className="text-sm font-semibold text-foreground">
                      {destination.destinationRef}
                    </p>
                    <p className="text-xs text-muted">
                      {destination.cityName ?? t("No city label")}
                    </p>
                  </div>
                  <p className="text-xs text-muted">
                    {t("Sort order:")} {formatNumber(destination.sortOrder)}
                  </p>
                  <p className="text-xs text-muted">
                    {destination.enabled ? t("Enabled") : t("Disabled")}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleToggleDestination(destination)}
                      loading={rowBusy}
                      loadingText="Saving"
                    >
                      {destination.enabled ? t("Disable") : t("Enable")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => void handleDeleteDestination(destination)}
                      disabled={rowBusy}
                    >
                      {t("Delete")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Products sync")}
        </h2>

        <form className="grid gap-3 lg:grid-cols-3" onSubmit={handleSyncProducts}>
          <Input
            label={t("Count per page")}
            value={count}
            placeholder={String(DEFAULT_COUNT)}
            onChange={(event) => setCount(event.target.value)}
          />
          <Input
            label={t("Max pages")}
            value={maxPages}
            onChange={(event) => setMaxPages(event.target.value)}
          />
          <Input
            label={t("Language (Accept-Language)")}
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          />
          <Input
            label={t("Modified since (optional)")}
            type="datetime-local"
            value={modifiedSince}
            onChange={(event) => setModifiedSince(event.target.value)}
          />

          <div className="flex items-end lg:col-span-1">
            <Checkbox
              label={t("Reset saved cursor before sync")}
              checked={resetCursor}
              onChange={(event) => setResetCursor(event.target.checked)}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              loading={running}
              loadingText="Syncing"
            >
              {t("Start products sync")}
            </Button>
          </div>
        </form>
      </Card>

      {error ? (
        <Card className="space-y-2 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">{t("Sync error")}</p>
          <p className="text-sm text-muted">{error.message}</p>
        </Card>
      ) : null}

      {lastResult ? (
        <Card className="space-y-3 p-5">
          <h2 className="text-base font-semibold text-foreground">
            {t("Latest result")}
          </h2>
          <p className="text-sm text-muted">{lastResult.message}</p>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                {t("Pages:")}
              </span>{" "}
              {formatNumber(lastResult.pagesProcessed)}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                {t("Products seen:")}
              </span>{" "}
              {formatNumber(lastResult.productsSeen)}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                {t("Created:")}
              </span>{" "}
              {formatNumber(lastResult.created)}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                {t("Updated:")}
              </span>{" "}
              {formatNumber(lastResult.updated)}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                {t("Deactivated:")}
              </span>{" "}
              {formatNumber(lastResult.deactivated)}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                {t("Errors:")}
              </span>{" "}
              {formatNumber(lastResult.errors)}
            </p>
            <p className="text-sm text-muted md:col-span-2 xl:col-span-2">
              <span className="font-semibold text-foreground">
                {t("Next cursor:")}
              </span>{" "}
              {lastResult.nextCursor ?? t("-")}
            </p>
          </div>

          {lastResult.errorMessages.length ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {t("Error messages")}
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {lastResult.errorMessages.map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
};
