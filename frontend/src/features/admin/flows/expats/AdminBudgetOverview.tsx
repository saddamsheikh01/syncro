"use client";

import { useCallback, useEffect, useState } from "react";
import { adminGetBudgetSimulations, adminGetBudgetStats } from "@/services/admin/expats";
import { normalizeApiError } from "@/services/axiosConfig";
import type { AdminBudgetSimulation, AdminBudgetStats } from "@/types/adminExpats";
import type { PageResponse } from "@/types/shared";
import type { ApiError } from "@/types/api";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { AdminTable, type AdminTableColumn, type AdminTableRow } from "@/features/admin/sections/AdminTable";
import { AdminStatCard } from "@/features/admin/cards/AdminStatCard";
import { Button } from "@/components/buttons/Button";
import { Badge, type BadgeTone } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { useT } from "@/hooks";
import { formatDateTime } from "@/features/admin/lib/formatters";

const SOURCE_OPTIONS = [
  { value: "", label: "All Sources" },
  { value: "anonymous", label: "Anonymous" },
  { value: "registered", label: "Registered" },
];

const PLAN_OPTIONS = [
  { value: "", label: "All Plans" },
  { value: "FREE", label: "Free" },
  { value: "PREMIUM", label: "Premium" },
  { value: "SUPER_PRO", label: "Super Pro" },
];

function sourceBadgeTone(source: string): BadgeTone {
  return source === "registered" ? "success" : "warning";
}

function balanceBadgeTone(status: string | null): BadgeTone {
  if (status === "POSITIVE") return "success";
  if (status === "DEFICIT") return "danger";
  return "neutral";
}

const COLUMNS: AdminTableColumn[] = [
  { key: "source", label: "Source", width: "100px" },
  { key: "user", label: "User / Session", width: "200px" },
  { key: "city", label: "City", width: "120px" },
  { key: "plan", label: "Plan", width: "80px" },
  { key: "cost", label: "Monthly Cost", align: "right", width: "120px" },
  { key: "balance", label: "Balance", align: "right", width: "120px" },
  { key: "date", label: "Date", width: "160px" },
];

export const AdminBudgetOverview = () => {
  const { t } = useT();

  const [page, setPage] = useState(0);
  const [sourceFilter, setSourceFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<PageResponse<AdminBudgetSimulation> | null>(null);
  const [stats, setStats] = useState<AdminBudgetStats | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSimulations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetBudgetSimulations({
        source: sourceFilter || undefined,
        planCode: planFilter || undefined,
        page,
        size: 20,
      });
      setResponse(data);
    } catch (e) {
      setError(normalizeApiError(e) as ApiError);
    } finally {
      setLoading(false);
    }
  }, [sourceFilter, planFilter, page]);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminGetBudgetStats();
      setStats(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadSimulations();
    loadStats();
  }, [loadSimulations, loadStats]);

  const rows: AdminTableRow[] = (response?.content ?? []).map((sim) => ({
    id: sim.id,
    source: <Badge tone={sourceBadgeTone(sim.source)}>{sim.source}</Badge>,
    user: sim.source === "registered"
      ? <span className="text-xs">{sim.userEmail ?? sim.userId}</span>
      : <span className="text-xs text-muted">{sim.sessionId?.slice(0, 8)}...</span>,
    city: sim.cityName ?? "—",
    plan: <Badge tone="neutral">{sim.planCode}</Badge>,
    cost: sim.estimatedMonthlyCost != null
      ? <span className="font-semibold">€{sim.estimatedMonthlyCost.toLocaleString()}</span>
      : "—",
    balance: sim.monthlyBalance != null
      ? <span style={{ color: (sim.balanceStatus === "DEFICIT") ? "#dc2626" : "#16a34a" }}>
          {sim.monthlyBalance >= 0 ? "+" : ""}€{sim.monthlyBalance.toLocaleString()}
        </span>
      : "—",
    date: formatDateTime(sim.createdAt),
  }));

  const conversionRate = stats && stats.total > 0
    ? ((stats.registered / stats.total) * 100).toFixed(1) + "%"
    : "0%";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Budget Simulations")}
        subtitle={t("All budget simulations from anonymous and registered users")}
      />

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <AdminStatCard label={t("Total Simulations")} value={String(stats.total)} />
          <AdminStatCard
            label={t("Anonymous")}
            value={String(stats.anonymous)}
            trendLabel={stats.total > 0 ? `${((stats.anonymous / stats.total) * 100).toFixed(0)}%` : "0%"}
            trend="neutral"
          />
          <AdminStatCard
            label={t("Registered")}
            value={String(stats.registered)}
            trendLabel={conversionRate}
            trend="up"
          />
          <AdminStatCard label={t("Last 24h")} value={String(stats.last24h)} />
        </div>
      )}

      {stats?.topCity && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <AdminStatCard label={t("Top City")} value={stats.topCity} />
          {Object.entries(stats.byPlan).map(([plan, count]) => (
            <AdminStatCard key={plan} label={plan} value={String(count)} />
          ))}
        </div>
      )}

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(0); }}
        >
          {PLAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button variant="ghost" onClick={() => { setSourceFilter(""); setPlanFilter(""); setPage(0); }}>
          {t("Reset")}
        </Button>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader /></div>
      ) : error ? (
        <Card className="p-6 text-center text-sm text-danger">{error.message}</Card>
      ) : (
        <>
          <AdminTable columns={COLUMNS} rows={rows} emptyLabel={t("No simulations found")} />

          {/* Pagination */}
          {response && response.totalPages > 1 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-muted">
                {t("Page")} {page + 1} / {response.totalPages} ({response.totalElements} {t("total")})
              </span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  {t("Previous")}
                </Button>
                <Button variant="outline" disabled={page >= response.totalPages - 1} onClick={() => setPage(page + 1)}>
                  {t("Next")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
