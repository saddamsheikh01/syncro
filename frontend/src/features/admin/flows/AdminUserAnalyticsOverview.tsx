"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { AdminStatCard } from "@/features/admin/cards/AdminStatCard";
import { KpiChartCard } from "@/features/admin/cards/KpiChartCard";
import { KpiRangeSelector } from "@/features/admin/elements/KpiRangeSelector";
import { formatNumber } from "@/features/admin/lib/formatters";
import { buildTrend, toChartPoints } from "@/features/admin/lib/kpis";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { useT } from "@/hooks";
import { getUserAnalytics } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { AdminUserAnalyticsResponse, AnalyticsKpiParams } from "@/types/analytics";

const RANGE_ITEMS = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
] as const;

const trendToTone = (trend: "up" | "down" | "neutral") => {
  if (trend === "up") return "success" as const;
  if (trend === "down") return "danger" as const;
  return "neutral" as const;
};

const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const buildRangeParams = (days: number): AnalyticsKpiParams => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { from: toIsoDate(start), to: toIsoDate(end) };
};

const prettifyLabel = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }
  return value.replaceAll("_", " ");
};

const getMissingSectionLabel = (
  section: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  testsCompleted: number,
  testsRequired: number
) => {
  switch (section) {
    case "profile":
      return t("Profile");
    case "preferences":
      return t("Preferences");
    case "position":
      return t("Location");
    case "interests":
      return t("Interests");
    case "tests":
      return `${t("Tests missing")} (${formatNumber(testsCompleted)}/${formatNumber(
        testsRequired
      )})`;
    default:
      return prettifyLabel(section);
  }
};

export interface AdminUserAnalyticsOverviewProps {
  userId: string;
}

export const AdminUserAnalyticsOverview = ({ userId }: AdminUserAnalyticsOverviewProps) => {
  const { t } = useT();
  const router = useRouter();

  const [selectedRangeId, setSelectedRangeId] = useState<string>("30d");
  const [data, setData] = useState<AdminUserAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const selectedRange = useMemo(
    () => RANGE_ITEMS.find((item) => item.id === selectedRangeId) ?? RANGE_ITEMS[1],
    [selectedRangeId]
  );
  const params = useMemo(
    () => buildRangeParams(selectedRange.days),
    [selectedRange.days]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserAnalytics(userId, params);
      setData(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [params, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const analytics = useMemo(() => {
    return {
      chatTrend: buildTrend(data?.chatDaily),
      mapTrend: buildTrend(data?.mapDaily),
      matchTrend: buildTrend(data?.matchDaily),
      momentsTrend: buildTrend(data?.momentsDaily),
      chatChart: toChartPoints(data?.chatDaily),
      mapChart: toChartPoints(data?.mapDaily),
      matchChart: toChartPoints(data?.matchDaily),
      momentsChart: toChartPoints(data?.momentsDaily),
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("User analytics")}
        subtitle={t("Detailed analytics for the selected user.")}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/admin/users")}
            >
              {t("Back to users")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void load()}>
              {t("Refresh")}
            </Button>
          </div>
        }
      />

      <KpiRangeSelector
        ranges={RANGE_ITEMS.map((item) => ({ id: item.id, label: t(item.label) }))}
        selectedId={selectedRangeId}
        onRangeSelect={setSelectedRangeId}
      />

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading user analytics...")}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">
            {t("Unable to load user analytics")}
          </p>
          <p className="text-sm text-muted">{t(error.message)}</p>
          <Button size="sm" variant="outline" onClick={() => void load()}>
            {t("Try again")}
          </Button>
        </Card>
      ) : null}

      {!loading && !error && data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              label={t("User")}
              value={data.fullName ?? data.username ?? data.email ?? "-"}
              trend="neutral"
              trendLabel={data.email ?? "-"}
            />
            <AdminStatCard
              label={t("Onboarding")}
              value={data.onboardingCompleted ? t("Completed") : t("In progress")}
              trend="neutral"
              trendLabel={t("Current status")}
            />
            <AdminStatCard
              label={t("Location")}
              value={`${data.city ?? "-"} / ${data.country ?? "-"}`}
              trend="neutral"
              trendLabel={`${prettifyLabel(data.gender)}${data.age != null ? ` - ${data.age}` : ""}`}
            />
            <AdminStatCard
              label={t("Profile completion")}
              value={`${formatNumber(data.profileCompletionPercent)}%`}
              trend="neutral"
              trendLabel={
                data.missingSections.length
                  ? data.missingSections
                      .map((section) =>
                        getMissingSectionLabel(
                          section,
                          t,
                          data.testsCompleted,
                          data.testsRequired
                        )
                      )
                      .join(", ")
                  : t("No missing sections")
              }
            />
            <AdminStatCard
              label={t("Chat uses")}
              value={formatNumber(data.chatUses)}
              trend={analytics.chatTrend.direction}
              trendLabel={t(analytics.chatTrend.labelKey, analytics.chatTrend.labelValues)}
            />
            <AdminStatCard
              label={t("Map uses")}
              value={formatNumber(data.mapUses)}
              trend={analytics.mapTrend.direction}
              trendLabel={t(analytics.mapTrend.labelKey, analytics.mapTrend.labelValues)}
            />
            <AdminStatCard
              label={t("Match uses")}
              value={formatNumber(data.matchUses)}
              trend={analytics.matchTrend.direction}
              trendLabel={t(analytics.matchTrend.labelKey, analytics.matchTrend.labelValues)}
            />
            <AdminStatCard
              label={t("Moments uses")}
              value={formatNumber(data.momentsUses)}
              trend={analytics.momentsTrend.direction}
              trendLabel={t(analytics.momentsTrend.labelKey, analytics.momentsTrend.labelValues)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <KpiChartCard
              title={t("Chat usage")}
              subtitle={t("Daily series")}
              value={formatNumber(data.chatUses)}
              deltaLabel={t(analytics.chatTrend.labelKey, analytics.chatTrend.labelValues)}
              deltaTone={trendToTone(analytics.chatTrend.direction)}
              dataPoints={analytics.chatChart}
            />
            <KpiChartCard
              title={t("Map usage")}
              subtitle={t("Daily series")}
              value={formatNumber(data.mapUses)}
              deltaLabel={t(analytics.mapTrend.labelKey, analytics.mapTrend.labelValues)}
              deltaTone={trendToTone(analytics.mapTrend.direction)}
              dataPoints={analytics.mapChart}
            />
            <KpiChartCard
              title={t("Match usage")}
              subtitle={t("Daily series")}
              value={formatNumber(data.matchUses)}
              deltaLabel={t(analytics.matchTrend.labelKey, analytics.matchTrend.labelValues)}
              deltaTone={trendToTone(analytics.matchTrend.direction)}
              dataPoints={analytics.matchChart}
            />
            <KpiChartCard
              title={t("Moments usage")}
              subtitle={t("Daily series")}
              value={formatNumber(data.momentsUses)}
              deltaLabel={t(analytics.momentsTrend.labelKey, analytics.momentsTrend.labelValues)}
              deltaTone={trendToTone(analytics.momentsTrend.direction)}
              dataPoints={analytics.momentsChart}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="space-y-2 p-5">
              <h3 className="text-sm font-semibold text-foreground">{t("Interests")}</h3>
              <p className="text-2xl font-semibold text-foreground">
                {formatNumber(data.interestsCount)}
              </p>
            </Card>
            <Card className="space-y-2 p-5">
              <h3 className="text-sm font-semibold text-foreground">{t("Tests completed")}</h3>
              <p className="text-2xl font-semibold text-foreground">
                {formatNumber(data.testsCompleted)} / {formatNumber(data.testsRequired)}
              </p>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
};
