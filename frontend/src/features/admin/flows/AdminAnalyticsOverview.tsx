"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { AdminStatCard } from "@/features/admin/cards/AdminStatCard";
import { KpiChartCard } from "@/features/admin/cards/KpiChartCard";
import { KpiRangeSelector } from "@/features/admin/elements/KpiRangeSelector";
import { formatDuration, formatNumber } from "@/features/admin/lib/formatters";
import { buildTrend, lastSeriesValue, sumSeries, toChartPoints } from "@/features/admin/lib/kpis";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { useT } from "@/hooks";
import { getKpis, refreshKpis } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { AnalyticsKpiParams, AnalyticsKpiResponse } from "@/types/analytics";

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

  return {
    from: toIsoDate(start),
    to: toIsoDate(end),
  };
};

export const AdminAnalyticsOverview = () => {
  const { t } = useT();

  const [selectedRangeId, setSelectedRangeId] = useState<string>("30d");
  const [kpis, setKpis] = useState<AnalyticsKpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const selectedRange = useMemo(
    () => RANGE_ITEMS.find((item) => item.id === selectedRangeId) ?? RANGE_ITEMS[1],
    [selectedRangeId]
  );

  const params = useMemo(
    () => buildRangeParams(selectedRange.days),
    [selectedRange.days]
  );

  const loadKpis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getKpis(params);
      setKpis(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void loadKpis();
  }, [loadKpis]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      await refreshKpis(params);
      const response = await getKpis(params);
      setKpis(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setRefreshing(false);
    }
  };

  const analytics = useMemo(() => {
    const registrations = sumSeries(kpis?.registrationsDaily);
    const onboardingCompleted = sumSeries(kpis?.onboardingCompletedDaily);
    const mapOpened = sumSeries(kpis?.mapOpenedDaily);
    const profileViewed = sumSeries(kpis?.profileViewedDaily);
    const matchOpened = sumSeries(kpis?.matchSectionOpenedDaily);

    return {
      registrations,
      onboardingCompleted,
      mapOpened,
      profileViewed,
      matchOpened,
      dau: lastSeriesValue(kpis?.activeUsersDaily),
      wau: lastSeriesValue(kpis?.activeUsersWeekly),
      returningUsers: kpis?.returningUsers ?? 0,
      avgSessionDuration: kpis?.averageSessionDurationSeconds ?? 0,
      registrationsTrend: buildTrend(kpis?.registrationsDaily),
      onboardingTrend: buildTrend(kpis?.onboardingCompletedDaily),
      activeUsersTrend: buildTrend(kpis?.activeUsersDaily),
      mapTrend: buildTrend(kpis?.mapOpenedDaily),
      profileTrend: buildTrend(kpis?.profileViewedDaily),
      matchTrend: buildTrend(kpis?.matchSectionOpenedDaily),
      registrationsChart: toChartPoints(kpis?.registrationsDaily),
      onboardingChart: toChartPoints(kpis?.onboardingCompletedDaily),
      activeUsersChart: toChartPoints(kpis?.activeUsersDaily),
      mapChart: toChartPoints(kpis?.mapOpenedDaily),
      profileChart: toChartPoints(kpis?.profileViewedDaily),
      matchChart: toChartPoints(kpis?.matchSectionOpenedDaily),
    };
  }, [kpis]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Analytics overview")}
        subtitle={t("Key KPIs, trends, and usage signals for the selected range.")}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            loadingText={t("Refreshing")}
          >
            {t("Refresh KPIs")}
          </Button>
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
          <p className="text-sm text-muted">{t("Loading analytics KPIs...")}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">{t("Unable to load KPIs")}</p>
          <p className="text-sm text-muted">{t(error.message)}</p>
          <Button size="sm" variant="outline" onClick={() => void loadKpis()}>
            {t("Try again")}
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              label={t("Registrations")}
              value={formatNumber(analytics.registrations)}
              trend={analytics.registrationsTrend.direction}
              trendLabel={t(
                analytics.registrationsTrend.labelKey,
                analytics.registrationsTrend.labelValues
              )}
            />
            <AdminStatCard
              label={t("Onboarding completed")}
              value={formatNumber(analytics.onboardingCompleted)}
              trend={analytics.onboardingTrend.direction}
              trendLabel={t(
                analytics.onboardingTrend.labelKey,
                analytics.onboardingTrend.labelValues
              )}
            />
            <AdminStatCard
              label={t("Daily active users")}
              value={formatNumber(analytics.dau)}
              trend={analytics.activeUsersTrend.direction}
              trendLabel={t(
                analytics.activeUsersTrend.labelKey,
                analytics.activeUsersTrend.labelValues
              )}
            />
            <AdminStatCard
              label={t("Average session duration")}
              value={formatDuration(analytics.avgSessionDuration)}
              trend="neutral"
              trendLabel={t("Period average")}
            />
            <AdminStatCard
              label={t("Weekly active users")}
              value={formatNumber(analytics.wau)}
              trend="neutral"
              trendLabel={t("Latest available bucket")}
            />
            <AdminStatCard
              label={t("Returning users")}
              value={formatNumber(analytics.returningUsers)}
              trend="neutral"
              trendLabel={t("Latest weekly window")}
            />
            <AdminStatCard
              label={t("Match section opened")}
              value={formatNumber(analytics.matchOpened)}
              trend={analytics.matchTrend.direction}
              trendLabel={t(
                analytics.matchTrend.labelKey,
                analytics.matchTrend.labelValues
              )}
            />
            <AdminStatCard
              label={t("Map opened")}
              value={formatNumber(analytics.mapOpened)}
              trend={analytics.mapTrend.direction}
              trendLabel={t(
                analytics.mapTrend.labelKey,
                analytics.mapTrend.labelValues
              )}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <KpiChartCard
              title={t("Registrations")}
              subtitle={t("Daily series")}
              value={formatNumber(analytics.registrations)}
              deltaLabel={t(
                analytics.registrationsTrend.labelKey,
                analytics.registrationsTrend.labelValues
              )}
              deltaTone={trendToTone(analytics.registrationsTrend.direction)}
              dataPoints={analytics.registrationsChart}
            />
            <KpiChartCard
              title={t("Onboarding completed")}
              subtitle={t("Daily series")}
              value={formatNumber(analytics.onboardingCompleted)}
              deltaLabel={t(
                analytics.onboardingTrend.labelKey,
                analytics.onboardingTrend.labelValues
              )}
              deltaTone={trendToTone(analytics.onboardingTrend.direction)}
              dataPoints={analytics.onboardingChart}
            />
            <KpiChartCard
              title={t("Active users (DAU)")}
              subtitle={t("Daily series")}
              value={formatNumber(analytics.dau)}
              deltaLabel={t(
                analytics.activeUsersTrend.labelKey,
                analytics.activeUsersTrend.labelValues
              )}
              deltaTone={trendToTone(analytics.activeUsersTrend.direction)}
              dataPoints={analytics.activeUsersChart}
            />
            <KpiChartCard
              title={t("Match section opened")}
              subtitle={t("Daily series")}
              value={formatNumber(analytics.matchOpened)}
              deltaLabel={t(
                analytics.matchTrend.labelKey,
                analytics.matchTrend.labelValues
              )}
              deltaTone={trendToTone(analytics.matchTrend.direction)}
              dataPoints={analytics.matchChart}
            />
            <KpiChartCard
              title={t("Profile viewed")}
              subtitle={t("Daily series")}
              value={formatNumber(analytics.profileViewed)}
              deltaLabel={t(
                analytics.profileTrend.labelKey,
                analytics.profileTrend.labelValues
              )}
              deltaTone={trendToTone(analytics.profileTrend.direction)}
              dataPoints={analytics.profileChart}
            />
            <KpiChartCard
              title={t("Map opened")}
              subtitle={t("Daily series")}
              value={formatNumber(analytics.mapOpened)}
              deltaLabel={t(
                analytics.mapTrend.labelKey,
                analytics.mapTrend.labelValues
              )}
              deltaTone={trendToTone(analytics.mapTrend.direction)}
              dataPoints={analytics.mapChart}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};
