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

export const AdminFunnelAnalyticsOverview = () => {
  const { t } = useT();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<FunnelAnalyticsResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await adminGetFunnelAnalytics();
      setData(resp);
    } catch (e) {
      setError(normalizeApiError(e) as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

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
        subtitle={t("KPI and drop-off analysis for the expats funnel.")}
        actions={<Button size="sm" variant="outline" onClick={() => void load()}>{t("Refresh")}</Button>}
      />

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
              <tr className="border-b text-left text-xs text-muted">
                <th className="px-3 py-2">{t("Step")}</th>
                <th className="px-3 py-2">{t("Reached")}</th>
                <th className="px-3 py-2">{t("Dropped")}</th>
                <th className="px-3 py-2">{t("Drop-off rate")}</th>
                <th className="px-3 py-2">{t("Funnel")}</th>
              </tr>
            </thead>
            <tbody>
              {data.stepDropOff.map((step) => {
                const pct = data.totalSessions > 0
                  ? Math.round((step.sessionsReached / data.totalSessions) * 100)
                  : 0;
                return (
                  <tr key={step.step} className="border-b">
                    <td className="px-3 py-2 font-medium">{t("Step")} {step.step}</td>
                    <td className="px-3 py-2">{step.sessionsReached}</td>
                    <td className="px-3 py-2 text-danger">{step.sessionsDropped}</td>
                    <td className="px-3 py-2">{step.dropOffRate}%</td>
                    <td className="px-3 py-2">
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
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
