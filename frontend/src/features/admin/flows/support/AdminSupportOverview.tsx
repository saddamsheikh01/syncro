"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { useT } from "@/hooks";
import { getSupportMessages } from "@/services/admin";
import type { AdminSupportCategory, AdminSupportMessageResponse } from "@/types/admin";
import type { ApiError } from "@/types/api";
import type { PageResponse } from "@/types/shared";

const PREVIEW_MAX_LENGTH = 120;

const previewText = (value: string) => {
  if (value.length <= PREVIEW_MAX_LENGTH) return value;
  return `${value.slice(0, PREVIEW_MAX_LENGTH - 3)}...`;
};

const categoryTone = (category: AdminSupportCategory | null) => {
  if (category === "BUG") return "danger" as const;
  if (category === "FEATURE") return "accent" as const;
  if (category === "ACCOUNT") return "warning" as const;
  return "neutral" as const;
};

export const AdminSupportOverview = () => {
  const { t } = useT();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [appliedCategory, setAppliedCategory] = useState<string>("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] =
    useState<PageResponse<AdminSupportMessageResponse> | null>(null);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: t("All categories") },
      { value: "GENERAL", label: t("General") },
      { value: "BUG", label: t("Bug or issue") },
      { value: "FEATURE", label: t("Feature request") },
      { value: "ACCOUNT", label: t("Account") },
      { value: "OTHER", label: t("Other") },
    ],
    [t],
  );

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSupportMessages({
        q: appliedQuery.trim() || undefined,
        category: (appliedCategory || undefined) as AdminSupportCategory | undefined,
        page,
        size: 20,
      });
      setResponse(result);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [appliedCategory, appliedQuery, page]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const rows = useMemo(() => {
    if (!response?.content.length) return [];

    return response.content.map((item) => {
      const userLabel =
        item.fullName?.trim() ||
        item.username?.trim() ||
        item.userEmail?.trim() ||
        item.userId;
      const userEmail = item.userEmail?.trim() || "";
      const mailtoHref = userEmail
        ? `mailto:${userEmail}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`
        : "";

      return {
        id: item.id,
        createdAt: formatDateTime(item.createdAt),
        user: userLabel,
        email: userEmail || "-",
        category: (
          <Badge tone={categoryTone(item.category)}>
            {item.category ? t(item.category) : t("General")}
          </Badge>
        ),
        subject: previewText(item.subject),
        message: previewText(item.message),
        action: userEmail ? (
          <a
            href={mailtoHref}
            className="inline-flex h-9 items-center justify-center rounded-full border border-accent/25 bg-surface px-4 text-xs font-semibold text-accent shadow-sm transition hover:border-accent/40"
          >
            {t("Reply via email")}
          </a>
        ) : (
          <span className="text-xs text-subtle">{t("Not available")}</span>
        ),
      };
    });
  }, [response, t]);

  const totalRequests = response?.totalElements ?? 0;
  const currentPage = response?.number ?? page;
  const totalPages = response?.totalPages ?? 0;
  const hasPrev = currentPage > 0;
  const hasNext = currentPage + 1 < totalPages;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Support inbox")}
        subtitle={t("All user support requests sent from the app.")}
      />

      <Card className="space-y-4 p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr,220px,auto]">
          <Input
            label={t("Search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search by subject, message, email or username")}
          />
          <Select
            label={t("Category")}
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            options={categoryOptions}
          />
          <div className="flex items-end gap-2">
            <Button
              size="sm"
              onClick={() => {
                setPage(0);
                setAppliedQuery(query);
                setAppliedCategory(categoryFilter);
              }}
            >
              {t("Apply filters")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setCategoryFilter("");
                setPage(0);
                setAppliedQuery("");
                setAppliedCategory("");
              }}
            >
              {t("Clear filters")}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/40 p-3">
            <p className="text-xs text-subtle">{t("Total requests")}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatNumber(totalRequests)}
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/40 p-3">
            <p className="text-xs text-subtle">{t("Current page")}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatNumber(currentPage + 1)}
            </p>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border/70 bg-surface-muted/40 p-3">
            <p className="text-xs text-subtle">{t("Total pages")}</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatNumber(totalPages)}
            </p>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="border-danger/30 bg-danger/10 p-5">
          <p className="text-sm text-danger">
            {error.message || t("Unable to load support requests.")}
          </p>
        </Card>
      ) : null}

      <AdminTable
        columns={[
          { key: "createdAt", label: t("Created at") },
          { key: "user", label: t("User") },
          { key: "email", label: t("Email") },
          { key: "category", label: t("Category") },
          { key: "subject", label: t("Subject") },
          { key: "message", label: t("Message") },
          { key: "action", label: t("Action"), align: "center" },
        ]}
        rows={loading ? [] : rows}
        emptyLabel={
          loading ? t("Loading...") : t("No support requests found.")
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {t("Page {current} of {total}", {
            current: currentPage + 1,
            total: Math.max(totalPages, 1),
          })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={!hasPrev || loading}
          >
            {t("Previous")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasNext || loading}
          >
            {t("Next")}
          </Button>
        </div>
      </div>
    </div>
  );
};
