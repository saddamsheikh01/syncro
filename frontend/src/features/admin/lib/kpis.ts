import type { KpiPoint } from "@/types/analytics";

export type TrendDirection = "up" | "down" | "neutral";

export type TrendLabelValues = Record<string, string | number>;

export type TrendData = {
  direction: TrendDirection;
  labelKey: string;
  labelValues?: TrendLabelValues;
};

export const sumSeries = (series: KpiPoint[] | undefined): number => {
  if (!series?.length) {
    return 0;
  }
  return series.reduce((total, item) => total + (Number(item.value) || 0), 0);
};

export const lastSeriesValue = (series: KpiPoint[] | undefined): number => {
  if (!series?.length) {
    return 0;
  }
  const last = series[series.length - 1];
  return Number(last.value) || 0;
};

const deltaPercent = (current: number, previous: number): number => {
  if (previous <= 0) {
    if (current > 0) {
      return 100;
    }
    return 0;
  }
  return ((current - previous) / previous) * 100;
};

export const buildTrend = (series: KpiPoint[] | undefined): TrendData => {
  if (!series?.length || series.length < 2) {
    return {
      direction: "neutral",
      labelKey: "Previous period not available",
    };
  }

  const midpoint = Math.floor(series.length / 2);
  const previousWindow = series.slice(0, midpoint);
  const currentWindow = series.slice(midpoint);

  const previousTotal = sumSeries(previousWindow);
  const currentTotal = sumSeries(currentWindow);
  const delta = deltaPercent(currentTotal, previousTotal);

  if (Math.abs(delta) < 0.1) {
    return {
      direction: "neutral",
      labelKey: "Stable vs previous period",
    };
  }

  if (delta > 0) {
    return {
      direction: "up",
      labelKey: "{delta}% vs previous period",
      labelValues: { delta: `+${delta.toFixed(1)}` },
    };
  }

  return {
    direction: "down",
    labelKey: "{delta}% vs previous period",
    labelValues: { delta: delta.toFixed(1) },
  };
};

export const toChartPoints = (
  series: KpiPoint[] | undefined,
  maxPoints = 7
): number[] => {
  if (!series?.length) {
    return [];
  }

  const points = series.slice(-maxPoints).map((item) => Number(item.value) || 0);
  const maxValue = Math.max(...points, 1);

  return points.map((value) => {
    const normalized = (value / maxValue) * 100;
    return Math.max(6, Math.round(normalized));
  });
};
