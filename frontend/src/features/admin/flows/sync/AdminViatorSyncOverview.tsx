"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Checkbox } from "@/components/elements/Checkbox";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { formatNumber } from "@/features/admin/lib/formatters";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { getViatorSyncStatus, syncViatorProducts } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { ViatorSyncResponse, ViatorSyncStatusResponse } from "@/types/admin";
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
  const { t } = useT();
  const [status, setStatus] = useState<ViatorSyncStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [lastResult, setLastResult] = useState<ViatorSyncResponse | null>(null);

  const [count, setCount] = useState("100");
  const [maxPages, setMaxPages] = useState("5");
  const [language, setLanguage] = useState("en-US");
  const [modifiedSince, setModifiedSince] = useState("");
  const [resetCursor, setResetCursor] = useState(false);

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

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleSyncProducts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRunning(true);
    setError(null);

    try {
      const response = await syncViatorProducts({
        count: parseOptionalInteger(count),
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
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Products sync")}
        </h2>

        <form className="grid gap-3 lg:grid-cols-3" onSubmit={handleSyncProducts}>
          <Input
            label={t("Count per page")}
            value={count}
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
              loadingText={t("Syncing")}
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
