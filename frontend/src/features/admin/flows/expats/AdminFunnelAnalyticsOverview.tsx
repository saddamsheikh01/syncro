"use client";

import { useCallback, useEffect, useState } from "react";
import { adminGetFunnelAnalytics } from "@/services/admin/expats";
import { normalizeApiError } from "@/services/axiosConfig";
import type { FunnelAnalyticsResponse } from "@/types/adminExpats";
import type { ApiError } from "@/types/api";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { AdminStatCard } from "@/features/admin/cards/AdminStatCard";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { useT } from "@/hooks";
import { formatQuestionKey, formatAnswerValue } from "@/features/admin/lib/funnelLabels";

const PERIOD_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function periodToParams(period: string): { from?: string; to?: string } {
  if (period === "all") return {};
  const now = new Date();
  const to = now.toISOString();
  let from: Date;
  switch (period) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      return {};
  }
  return { from: from.toISOString(), to };
}

export const AdminFunnelAnalyticsOverview = () => {
  const { t } = useT();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<FunnelAnalyticsResponse | null>(null);
  const [period, setPeriod] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await adminGetFunnelAnalytics(periodToParams(period));
      setData(resp);
    } catch (e) {
      setError(normalizeApiError(e) as ApiError);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title={t("Funnel Analytics")} subtitle={t("KPI and drop-off analysis for the expats funnel.")} />
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Computing analytics...")}</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title={t("Funnel Analytics")} subtitle={t("KPI and drop-off analysis for the expats funnel.")} />
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">{t("Unable to load analytics")}</p>
          <p className="text-sm text-muted">{error.message}</p>
          <Button size="sm" onClick={() => void load()}>{t("Retry")}</Button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Funnel Analytics")}
        subtitle={t("KPI and drop-off analysis for the expats funnel. Ghost sessions (no answers) are excluded.")}
        actions={<Button size="sm" variant="outline" onClick={() => void load()}>{t("Refresh")}</Button>}
      />

      <Card className="flex items-end gap-4 p-5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted">{t("Period")}</label>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <p className="pb-2 text-sm text-subtle">
          {t("Showing {count} sessions with answers", { count: String(data.totalSessions) })}
        </p>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <AdminStatCard label={t("Total sessions")} value={String(data.totalSessions)} />
        <AdminStatCard label={t("Completed")} value={String(data.completedSessions)} />
        <AdminStatCard label={t("Converted")} value={String(data.convertedSessions)} />
        <AdminStatCard label={t("Completion rate")} value={`${data.completionRate}%`} />
        <AdminStatCard label={t("Conversion rate")} value={`${data.conversionRate}%`} />
      </div>

      {/* Drop-off per step */}
      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">{t("Drop-off per step")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="w-16 px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">{t("Step")}</th>
                <th className="px-3 py-2.5 text-right">{t("Reached")}</th>
                <th className="px-3 py-2.5 text-right">{t("Dropped")}</th>
                <th className="px-3 py-2.5 text-right">{t("Drop-off")}</th>
                <th className="w-48 px-3 py-2.5">{t("Funnel")}</th>
              </tr>
            </thead>
            <tbody>
              {data.stepDropOff.map((step) => {
                const pct = data.totalSessions > 0
                  ? Math.round((step.sessionsReached / data.totalSessions) * 100)
                  : 0;
                const stepNames: Record<number, string> = {
                  1: "Current situation", 2: "City selection", 3: "Timeline",
                  4: "Age & gender", 5: "Household", 6: "Main goal",
                  7: "Work status", 8: "Budget", 9: "Priority", 10: "City values",
                };
                const barColor = step.dropOffRate > 20 ? "bg-red-400" :
                                 step.dropOffRate > 10 ? "bg-amber-400" : "bg-blue-500";

                return (
                  <tr key={step.step} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50">
                    <td className="px-3 py-2.5">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                        {step.step}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">
                      {stepNames[step.step] ?? `Step ${step.step}`}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-700">
                      {step.sessionsReached}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {step.sessionsDropped > 0 ? (
                        <span className="font-semibold text-red-500">−{step.sessionsDropped}</span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {step.dropOffRate > 0 ? (
                        <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                          {step.dropOffRate}%
                        </span>
                      ) : (
                        <span className="text-gray-300">0%</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className={`h-2 rounded-full transition-all ${barColor}`}
                            style={{ width: `${pct}%`, minWidth: pct > 0 ? "4px" : "0" }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-medium text-gray-400">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top cities */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h3 className="text-sm font-semibold">{t("Top target cities")}</h3>
          {data.topTargetCities.length === 0 ? (
            <p className="text-sm text-muted">{t("No data yet.")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.topTargetCities.map((c) => (
                <li key={c.cityName} className="flex items-center justify-between">
                  <span>{c.cityName}</span>
                  <span className="font-medium">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <h3 className="text-sm font-semibold">{t("Waiting list top cities")}</h3>
          {data.waitingListTop.length === 0 ? (
            <p className="text-sm text-muted">{t("No waiting list entries yet.")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.waitingListTop.map((c) => (
                <li key={c.cityName} className="flex items-center justify-between">
                  <span>{c.cityName}</span>
                  <span className="font-medium">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Answer distributions */}
      <Card className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">{t("Answer distributions")}</h3>
        {data.answerDistributions.map((dist) => (
          <div key={dist.questionKey} className="space-y-2">
            <p className="text-xs font-semibold text-muted">
              {formatQuestionKey(dist.questionKey)}
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(dist.valueCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([value, count]) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs"
                  >
                    {formatAnswerValue(value)} <strong>{count}</strong>
                  </span>
                ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
