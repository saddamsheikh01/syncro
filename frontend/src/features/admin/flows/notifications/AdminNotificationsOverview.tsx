"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import { Textarea } from "@/components/elements/Textarea";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { useT } from "@/hooks";
import {
  createCustomNotifications,
  getNotificationCampaignHistory,
  getNotificationCampaignStats,
  searchNotificationRecipients,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  AdminNotificationCampaignSortBy,
  AdminNotificationCampaignSortDirection,
  AdminNotificationCampaignStatsResponse,
  AdminNotificationCampaignSummaryResponse,
  AdminNotificationRecipientResponse,
  AdminNotificationTargetType,
  NotificationResponse,
} from "@/types/admin";
import type { PageResponse, Uuid } from "@/types/shared";

const isApiError = (value: unknown): value is ApiError => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.code === "string" &&
    typeof record.status === "number" &&
    typeof record.message === "string"
  );
};

const formatRecipientLabel = (recipient: AdminNotificationRecipientResponse): string => {
  const fullName = recipient.fullName?.trim();
  const username = recipient.username?.trim();

  if (fullName && username) {
    return `${fullName} (@${username})`;
  }
  if (fullName) {
    return fullName;
  }
  if (username) {
    return `@${username}`;
  }
  return recipient.id;
};

type CampaignFilters = {
  title: string;
  from: string;
  to: string;
  sortBy: AdminNotificationCampaignSortBy;
  direction: AdminNotificationCampaignSortDirection;
};

const defaultCampaignFilters: CampaignFilters = {
  title: "",
  from: "",
  to: "",
  sortBy: "CREATED_AT",
  direction: "DESC",
};

const toIsoDateTime = (value: string): string | undefined => {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
};

export const AdminNotificationsOverview = () => {
  const { t } = useT();

  const [targetType, setTargetType] = useState<AdminNotificationTargetType>("ALL");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientResults, setRecipientResults] = useState<
    AdminNotificationRecipientResponse[]
  >([]);
  const [selectedRecipient, setSelectedRecipient] =
    useState<AdminNotificationRecipientResponse | null>(null);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientLookupError, setRecipientLookupError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdNotifications, setCreatedNotifications] = useState<NotificationResponse[]>([]);
  const [lastCampaignStats, setLastCampaignStats] =
    useState<AdminNotificationCampaignStatsResponse | null>(null);
  const [campaignStatsLoading, setCampaignStatsLoading] = useState(false);
  const [campaignStatsError, setCampaignStatsError] = useState<string | null>(null);
  const [campaignFilters, setCampaignFilters] =
    useState<CampaignFilters>(defaultCampaignFilters);
  const [appliedCampaignFilters, setAppliedCampaignFilters] =
    useState<CampaignFilters>(defaultCampaignFilters);
  const [campaignHistoryPage, setCampaignHistoryPage] = useState(0);
  const [campaignHistoryLoading, setCampaignHistoryLoading] = useState(false);
  const [campaignHistoryError, setCampaignHistoryError] = useState<string | null>(null);
  const [campaignHistoryResponse, setCampaignHistoryResponse] =
    useState<PageResponse<AdminNotificationCampaignSummaryResponse> | null>(null);

  const targetOptions = useMemo(
    () => [
      { value: "ALL", label: t("All users") },
      { value: "USER", label: t("Specific user") },
    ],
    [t]
  );

  const campaignSortOptions = useMemo(
    () => [
      { value: "CREATED_AT", label: t("Created at") },
      { value: "READ_RATE", label: t("Read rate") },
      { value: "SENT_COUNT", label: t("Sent") },
      { value: "READ_COUNT", label: t("Read") },
      { value: "TITLE", label: t("Title") },
    ],
    [t]
  );

  const campaignDirectionOptions = useMemo(
    () => [
      { value: "DESC", label: t("Descending") },
      { value: "ASC", label: t("Ascending") },
    ],
    [t]
  );

  const rows = useMemo(
    () =>
      createdNotifications.map((notification) => ({
        id: notification.id,
        idShort: notification.id,
        campaignId: notification.campaignId ?? "-",
        userId: notification.userId,
        title: notification.title,
        type: notification.type,
        createdAt: formatDateTime(notification.createdAt),
      })),
    [createdNotifications]
  );

  const campaignHistoryRows = useMemo(
    () =>
      (campaignHistoryResponse?.content ?? []).map((campaign) => ({
        id: campaign.campaignId,
        campaignId: campaign.campaignId,
        title: campaign.title ?? "-",
        createdAt: campaign.createdAt ? formatDateTime(campaign.createdAt) : "-",
        sentCount: formatNumber(campaign.sentCount),
        readCount: formatNumber(campaign.readCount),
        unreadCount: formatNumber(campaign.unreadCount),
        readRate: `${campaign.readRate.toFixed(2)}%`,
      })),
    [campaignHistoryResponse]
  );

  const lastCampaignId = useMemo<Uuid | null>(
    () => createdNotifications[0]?.campaignId ?? null,
    [createdNotifications]
  );

  const loadCampaignHistory = useCallback(
    async (page: number, filters: CampaignFilters) => {
      setCampaignHistoryLoading(true);
      setCampaignHistoryError(null);
      try {
        const response = await getNotificationCampaignHistory({
          title: filters.title.trim() || undefined,
          from: toIsoDateTime(filters.from),
          to: toIsoDateTime(filters.to),
          page,
          size: 10,
          sortBy: filters.sortBy,
          direction: filters.direction,
        });
        setCampaignHistoryResponse(response);
      } catch {
        setCampaignHistoryError("Unable to load campaign history.");
      } finally {
        setCampaignHistoryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (targetType !== "USER") {
      setRecipientLoading(false);
      setRecipientLookupError(null);
      setRecipientResults([]);
      return;
    }

    if (
      selectedRecipient &&
      recipientQuery === formatRecipientLabel(selectedRecipient)
    ) {
      setRecipientLoading(false);
      setRecipientLookupError(null);
      setRecipientResults([]);
      return;
    }

    const normalizedQuery = recipientQuery.trim();
    if (normalizedQuery.length < 2) {
      setRecipientLoading(false);
      setRecipientLookupError(null);
      setRecipientResults([]);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setRecipientLoading(true);
        setRecipientLookupError(null);

        try {
          const response = await searchNotificationRecipients({
            q: normalizedQuery,
            page: 0,
            size: 8,
          });
          if (!cancelled) {
            setRecipientResults(response.content);
          }
        } catch {
          if (!cancelled) {
            setRecipientResults([]);
            setRecipientLookupError("Unable to search users right now.");
          }
        } finally {
          if (!cancelled) {
            setRecipientLoading(false);
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [recipientQuery, selectedRecipient, targetType]);

  useEffect(() => {
    void loadCampaignHistory(campaignHistoryPage, appliedCampaignFilters);
  }, [appliedCampaignFilters, campaignHistoryPage, loadCampaignHistory]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setValidationError(null);

    try {
      if (targetType === "USER" && !selectedRecipient) {
        setValidationError("Select a user from suggestions.");
        return;
      }

      const response = await createCustomNotifications({
        targetType,
        userId: targetType === "USER" ? selectedRecipient?.id ?? null : null,
        title: title.trim(),
        body: body.trim() || null,
      });

      setCreatedNotifications(response);
      const campaignId = response[0]?.campaignId ?? null;
      if (campaignId) {
        setCampaignStatsLoading(true);
        setCampaignStatsError(null);
        try {
          const stats = await getNotificationCampaignStats(campaignId);
          setLastCampaignStats(stats);
        } catch {
          setLastCampaignStats(null);
          setCampaignStatsError("Unable to load campaign stats.");
        } finally {
          setCampaignStatsLoading(false);
        }
      } else {
        setLastCampaignStats(null);
        setCampaignStatsError(null);
        setCampaignStatsLoading(false);
      }
      setTitle("");
      setBody("");
      if (targetType === "USER") {
        setRecipientQuery("");
        setSelectedRecipient(null);
        setRecipientResults([]);
      }
      setCampaignHistoryPage(0);
      void loadCampaignHistory(0, appliedCampaignFilters);
    } catch (requestError) {
      if (isApiError(requestError)) {
        setError(requestError);
      } else {
        setError({
          code: "UNKNOWN",
          status: 0,
          message: "Unexpected error while sending notifications.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTargetTypeChange = (nextValue: string) => {
    const nextTarget: AdminNotificationTargetType =
      nextValue === "USER" ? "USER" : "ALL";
    setTargetType(nextTarget);
    setValidationError(null);
    if (nextTarget === "ALL") {
      setRecipientQuery("");
      setRecipientResults([]);
      setSelectedRecipient(null);
      setRecipientLookupError(null);
    }
  };

  const handleRecipientQueryChange = (value: string) => {
    setRecipientQuery(value);
    setSelectedRecipient(null);
    setValidationError(null);
  };

  const handleSelectRecipient = (recipient: AdminNotificationRecipientResponse) => {
    setSelectedRecipient(recipient);
    setRecipientQuery(formatRecipientLabel(recipient));
    setRecipientResults([]);
    setValidationError(null);
  };

  const refreshCampaignStats = async () => {
    if (!lastCampaignId) {
      return;
    }
    setCampaignStatsLoading(true);
    setCampaignStatsError(null);
    try {
      const stats = await getNotificationCampaignStats(lastCampaignId);
      setLastCampaignStats(stats);
    } catch {
      setCampaignStatsError("Unable to load campaign stats.");
    } finally {
      setCampaignStatsLoading(false);
    }
  };

  const handleCampaignFiltersSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCampaignHistoryPage(0);
    setAppliedCampaignFilters({ ...campaignFilters });
  };

  const handleCampaignFiltersReset = () => {
    setCampaignFilters(defaultCampaignFilters);
    setAppliedCampaignFilters(defaultCampaignFilters);
    setCampaignHistoryPage(0);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Custom notifications")}
        subtitle={t("Send custom notifications to all users or a specific user.")}
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Create notification")}
        </h2>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Select
            label={t("Recipients")}
            value={targetType}
            onValueChange={handleTargetTypeChange}
            options={targetOptions}
            required
          />

          {targetType === "USER" ? (
            <div className="space-y-2">
              <Input
                label={t("Search user")}
                value={recipientQuery}
                onChange={(event) => handleRecipientQueryChange(event.target.value)}
                placeholder={t("Search by username or full name")}
                required
              />
              {selectedRecipient ? (
                <p className="text-xs text-subtle">
                  {t("Selected user")}: {formatRecipientLabel(selectedRecipient)}
                </p>
              ) : null}
              <div className="space-y-2 rounded-[var(--radius-md)] border border-border/60 p-3">
                {recipientLoading ? (
                  <p className="text-sm text-subtle">{t("Searching users...")}</p>
                ) : recipientLookupError ? (
                  <p className="text-sm text-danger">{t(recipientLookupError)}</p>
                ) : recipientQuery.trim().length < 2 ? (
                  <p className="text-sm text-subtle">
                    {t("Type at least 2 characters to search users.")}
                  </p>
                ) : recipientResults.length === 0 ? (
                  <p className="text-sm text-subtle">{t("No users found.")}</p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {recipientResults.map((recipient) => (
                      <button
                        key={recipient.id}
                        type="button"
                        className="w-full rounded-[var(--radius-md)] border border-border/70 px-3 py-2 text-left hover:border-accent/40 hover:bg-accent-soft/40"
                        onClick={() => handleSelectRecipient(recipient)}
                      >
                        <p className="text-sm font-medium text-foreground">
                          {formatRecipientLabel(recipient)}
                        </p>
                        <p className="text-xs text-subtle">{recipient.id}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <Input
            label={t("Title")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            required
          />

          <Textarea
            label={t("Body")}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={1000}
            placeholder={t("Optional text")}
          />

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              loading={saving}
              loadingText={t("Sending")}
            >
              {t("Send notifications")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setTargetType("ALL");
                setRecipientQuery("");
                setRecipientResults([]);
                setSelectedRecipient(null);
                setRecipientLookupError(null);
                setTitle("");
                setBody("");
                setValidationError(null);
              }}
            >
              {t("Reset form")}
            </Button>
          </div>
        </form>
      </Card>

      {validationError ? (
        <Card className="space-y-2 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">
            {t("Validation error")}
          </p>
          <p className="text-sm text-muted">{t(validationError)}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-2 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">
            {t("Notification send error")}
          </p>
          <p className="text-sm text-muted">{t(error.message)}</p>
        </Card>
      ) : null}

      <Card className="p-5">
        <p className="text-sm text-subtle">
          {t("Last send: {count} notifications created", {
            count: formatNumber(createdNotifications.length),
          })}
        </p>
        {lastCampaignId ? (
          <p className="mt-2 text-xs text-subtle">
            {t("Campaign ID")}: {lastCampaignId}
          </p>
        ) : null}
        {lastCampaignStats ? (
          <div className="mt-3 grid gap-2 text-sm text-subtle sm:grid-cols-2 lg:grid-cols-4">
            <p>{t("Sent")}: {formatNumber(lastCampaignStats.sentCount)}</p>
            <p>{t("Read")}: {formatNumber(lastCampaignStats.readCount)}</p>
            <p>{t("Unread")}: {formatNumber(lastCampaignStats.unreadCount)}</p>
            <p>{t("Read rate")}: {lastCampaignStats.readRate.toFixed(2)}%</p>
          </div>
        ) : null}
        {campaignStatsError ? (
          <p className="mt-2 text-xs text-danger">{t(campaignStatsError)}</p>
        ) : null}
        {lastCampaignId ? (
          <div className="mt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={campaignStatsLoading}
              onClick={() => {
                void refreshCampaignStats();
              }}
            >
              {t("Refresh campaign stats")}
            </Button>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Campaign history")}
        </h2>

        <form className="grid gap-3 lg:grid-cols-6" onSubmit={handleCampaignFiltersSubmit}>
          <Input
            label={t("Title")}
            value={campaignFilters.title}
            onChange={(event) =>
              setCampaignFilters((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder={t("Filter by notification title")}
          />

          <Input
            label={t("From")}
            type="datetime-local"
            value={campaignFilters.from}
            onChange={(event) =>
              setCampaignFilters((current) => ({
                ...current,
                from: event.target.value,
              }))
            }
          />

          <Input
            label={t("To")}
            type="datetime-local"
            value={campaignFilters.to}
            onChange={(event) =>
              setCampaignFilters((current) => ({
                ...current,
                to: event.target.value,
              }))
            }
          />

          <Select
            label={t("Sort by")}
            value={campaignFilters.sortBy}
            onValueChange={(value) =>
              setCampaignFilters((current) => ({
                ...current,
                sortBy: value as AdminNotificationCampaignSortBy,
              }))
            }
            options={campaignSortOptions}
          />

          <Select
            label={t("Direction")}
            value={campaignFilters.direction}
            onValueChange={(value) =>
              setCampaignFilters((current) => ({
                ...current,
                direction: value as AdminNotificationCampaignSortDirection,
              }))
            }
            options={campaignDirectionOptions}
          />

          <div className="flex items-end gap-2">
            <Button type="submit" size="sm" loading={campaignHistoryLoading}>
              {t("Apply filters")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCampaignFiltersReset}
            >
              {t("Reset")}
            </Button>
          </div>
        </form>

        {campaignHistoryError ? (
          <p className="text-sm text-danger">{t(campaignHistoryError)}</p>
        ) : null}

        <AdminTable
          columns={[
            { key: "campaignId", label: t("Campaign ID") },
            { key: "title", label: t("Title") },
            { key: "createdAt", label: t("Created at") },
            { key: "sentCount", label: t("Sent"), align: "right" },
            { key: "readCount", label: t("Read"), align: "right" },
            { key: "unreadCount", label: t("Unread"), align: "right" },
            { key: "readRate", label: t("Read rate"), align: "right" },
          ]}
          rows={campaignHistoryRows}
          emptyLabel={
            campaignHistoryLoading
              ? t("Loading campaign history...")
              : t("No campaigns found")
          }
        />

        {campaignHistoryResponse ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-subtle">
              {t("Total campaigns: {count}", {
                count: formatNumber(campaignHistoryResponse.totalElements),
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={campaignHistoryResponse.first || campaignHistoryLoading}
                onClick={() => {
                  setCampaignHistoryPage((current) => Math.max(0, current - 1));
                }}
              >
                {t("Previous")}
              </Button>
              <p className="text-xs text-subtle">
                {t("Page")} {campaignHistoryResponse.number + 1} /{" "}
                {Math.max(campaignHistoryResponse.totalPages, 1)}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={campaignHistoryResponse.last || campaignHistoryLoading}
                onClick={() => {
                  setCampaignHistoryPage((current) => current + 1);
                }}
              >
                {t("Next")}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <AdminTable
        columns={[
          { key: "idShort", label: t("Notification ID") },
          { key: "campaignId", label: t("Campaign ID") },
          { key: "userId", label: t("User ID") },
          { key: "title", label: t("Title") },
          { key: "type", label: t("Type") },
          { key: "createdAt", label: t("Created at") },
        ]}
        rows={rows}
        emptyLabel={t("No notifications sent in this session")}
      />
    </div>
  );
};
