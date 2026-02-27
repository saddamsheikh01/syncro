"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { AdminStatCard } from "@/features/admin/cards/AdminStatCard";
import { KpiChartCard } from "@/features/admin/cards/KpiChartCard";
import { KpiRangeSelector } from "@/features/admin/elements/KpiRangeSelector";
import { formatDuration, formatNumber } from "@/features/admin/lib/formatters";
import { buildTrend, lastSeriesValue, sumSeries, toChartPoints } from "@/features/admin/lib/kpis";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { useT } from "@/hooks";
import { getKpis, getUsersFeatureUsage, refreshKpis } from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  AdminUserFeatureUsageResponse,
  AnalyticsKpiParams,
  AnalyticsKpiResponse,
  AnalyticsSegmentCountResponse,
} from "@/types/analytics";
import type { PageResponse } from "@/types/shared";

const RANGE_ITEMS = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
] as const;

const USER_USAGE_PAGE_SIZE = 20;

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

const prettifyLabel = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }
  return value.replaceAll("_", " ");
};

export const AdminAnalyticsOverview = () => {
  const { t } = useT();

  const [selectedRangeId, setSelectedRangeId] = useState<string>("30d");
  const [kpis, setKpis] = useState<AnalyticsKpiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [usersUsage, setUsersUsage] = useState<PageResponse<AdminUserFeatureUsageResponse> | null>(
    null
  );
  const [usersUsageLoading, setUsersUsageLoading] = useState(true);
  const [usersUsageError, setUsersUsageError] = useState<ApiError | null>(null);
  const [usersUsagePage, setUsersUsagePage] = useState(0);
  const [usersUsageQueryInput, setUsersUsageQueryInput] = useState("");
  const [usersUsageQuery, setUsersUsageQuery] = useState("");

  const selectedRange = useMemo(
    () => RANGE_ITEMS.find((item) => item.id === selectedRangeId) ?? RANGE_ITEMS[1],
    [selectedRangeId]
  );

  const params = useMemo(() => buildRangeParams(selectedRange.days), [selectedRange.days]);

  useEffect(() => {
    setUsersUsagePage(0);
  }, [params.from, params.to]);

  const usersUsageParams = useMemo(
    () => ({
      ...params,
      q: usersUsageQuery || undefined,
      page: usersUsagePage,
      size: USER_USAGE_PAGE_SIZE,
    }),
    [params, usersUsagePage, usersUsageQuery]
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

  const loadUsersUsage = useCallback(async () => {
    setUsersUsageLoading(true);
    setUsersUsageError(null);

    try {
      const response = await getUsersFeatureUsage(usersUsageParams);
      setUsersUsage(response);
    } catch (requestError) {
      setUsersUsageError(requestError as ApiError);
    } finally {
      setUsersUsageLoading(false);
    }
  }, [usersUsageParams]);

  useEffect(() => {
    void loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    void loadUsersUsage();
  }, [loadUsersUsage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    setUsersUsageError(null);

    try {
      await refreshKpis(params);
      const [kpisResponse, usersUsageResponse] = await Promise.all([
        getKpis(params),
        getUsersFeatureUsage(usersUsageParams),
      ]);
      setKpis(kpisResponse);
      setUsersUsage(usersUsageResponse);
    } catch (requestError) {
      const nextError = requestError as ApiError;
      setError(nextError);
      setUsersUsageError(nextError);
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
      countryDistribution: kpis?.countryDistribution ?? [],
      cityDistribution: kpis?.cityDistribution ?? [],
      genderDistribution: kpis?.genderDistribution ?? [],
      ageDistribution: kpis?.ageDistribution ?? [],
    };
  }, [kpis]);

  const demographicCards = useMemo(
    () =>
      [
        { key: "country", title: t("Nationality"), items: analytics.countryDistribution },
        { key: "city", title: t("City"), items: analytics.cityDistribution },
        { key: "gender", title: t("Gender"), items: analytics.genderDistribution },
        { key: "age", title: t("Age"), items: analytics.ageDistribution },
      ] as Array<{ key: string; title: string; items: AnalyticsSegmentCountResponse[] }>,
    [analytics.ageDistribution, analytics.cityDistribution, analytics.countryDistribution, analytics.genderDistribution, t]
  );

  const usersUsageRows = useMemo(() => {
    if (!usersUsage?.content.length) {
      return [];
    }

    return usersUsage.content.map((user) => ({
      id: user.userId,
      user: (
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">
            {user.fullName ?? user.username ?? user.email ?? "-"}
          </p>
          <p className="text-xs text-muted">{user.email ?? "-"}</p>
        </div>
      ),
      location: `${user.city ?? "-"} / ${user.country ?? "-"}`,
      demographics:
        user.age != null
          ? `${prettifyLabel(user.gender)} / ${user.age}`
          : prettifyLabel(user.gender),
      onboarding: user.onboardingCompleted ? t("Completed") : t("In progress"),
      usage: `Chat ${formatNumber(user.chatUses)} | Map ${formatNumber(
        user.mapUses
      )} | Match ${formatNumber(user.matchUses)} | Moments ${formatNumber(user.momentsUses)}`,
      profile: `${formatNumber(user.profileCompletionPercent)}%`,
      missing:
        user.missingSections.length > 0
          ? user.missingSections.map((section) => prettifyLabel(section)).join(", ")
          : t("None"),
    }));
  }, [t, usersUsage]);

  const usersUsageHasNext = useMemo(() => {
    if (!usersUsage) {
      return false;
    }
    return usersUsage.number + 1 < usersUsage.totalPages;
  }, [usersUsage]);

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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {demographicCards.map((card) => (
              <Card key={card.key} className="space-y-3 p-5">
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                {card.items.length ? (
                  <ul className="space-y-2">
                    {card.items.slice(0, 5).map((item) => (
                      <li
                        key={`${card.key}-${item.label}`}
                        className="flex items-center justify-between gap-2 text-sm text-muted"
                      >
                        <span className="truncate">{prettifyLabel(item.label)}</span>
                        <span className="font-semibold text-foreground">
                          {formatNumber(item.count)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">{t("No data available")}</p>
                )}
              </Card>
            ))}
          </div>

          <Card className="space-y-4 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t("Users feature usage")}
                </h3>
                <p className="text-sm text-muted">
                  {t(
                    "Usage counts for chat, map, match and moments with profile completion details."
                  )}
                </p>
              </div>
              <form
                className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
                onSubmit={(event) => {
                  event.preventDefault();
                  setUsersUsagePage(0);
                  setUsersUsageQuery(usersUsageQueryInput.trim());
                }}
              >
                <Input
                  className="sm:w-72"
                  placeholder={t("Search by email, username or full name")}
                  value={usersUsageQueryInput}
                  onChange={(event) => setUsersUsageQueryInput(event.target.value)}
                />
                <Button type="submit" size="sm" variant="outline">
                  {t("Search")}
                </Button>
              </form>
            </div>

            {usersUsageLoading ? (
              <div className="flex items-center gap-3 p-2">
                <Loader size="sm" />
                <p className="text-sm text-muted">{t("Loading users usage...")}</p>
              </div>
            ) : null}

            {usersUsageError ? (
              <Card className="space-y-3 border-danger/30 p-4">
                <p className="text-sm font-semibold text-danger">
                  {t("Unable to load users usage")}
                </p>
                <p className="text-sm text-muted">{t(usersUsageError.message)}</p>
                <Button size="sm" variant="outline" onClick={() => void loadUsersUsage()}>
                  {t("Try again")}
                </Button>
              </Card>
            ) : null}

            {!usersUsageLoading && !usersUsageError ? (
              <>
                <AdminTable
                  columns={[
                    { key: "user", label: t("User"), width: "22%" },
                    { key: "location", label: t("Location"), width: "12%" },
                    { key: "demographics", label: t("Gender/Age"), width: "11%" },
                    { key: "onboarding", label: t("Onboarding"), width: "10%" },
                    { key: "usage", label: t("Feature usage"), width: "25%" },
                    { key: "profile", label: t("Profile completion"), width: "10%" },
                    { key: "missing", label: t("Missing sections"), width: "10%" },
                  ]}
                  rows={usersUsageRows}
                  emptyLabel={t("No users found")}
                />

                <div className="flex flex-col gap-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    {t("Users: {{count}}", {
                      count: formatNumber(usersUsage?.totalElements ?? 0),
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUsersUsagePage((current) => Math.max(0, current - 1))}
                      disabled={usersUsagePage <= 0}
                    >
                      {t("Previous")}
                    </Button>
                    <span>
                      {formatNumber((usersUsage?.number ?? 0) + 1)} /{" "}
                      {formatNumber(Math.max(usersUsage?.totalPages ?? 1, 1))}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setUsersUsagePage((current) => current + 1)}
                      disabled={!usersUsageHasNext}
                    >
                      {t("Next")}
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </Card>
        </>
      ) : null}
    </div>
  );
};
