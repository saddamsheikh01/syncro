"use client";

import { Card } from "@/components/elements/Card";
import { ProgressBar, type ProgressBarTone } from "@/components/elements/ProgressBar";
import type { DimensionScores, MatchBreakdown } from "@/types/matches";
import { cx } from "@/lib/classNames";
import { resolveMatchDomainSlots } from "@/lib/matchDomains";
import { useT } from "@/hooks";

const DIMENSION_CONFIG: Record<
  keyof DimensionScores,
  { labelKey: string; emoji: string }
> = {
  interests: { labelKey: "Interests", emoji: "💫" },
  lifestyle: { labelKey: "Lifestyle", emoji: "🏃" },
  values: { labelKey: "Values", emoji: "💎" },
  objectives: { labelKey: "Goals", emoji: "🎯" },
  psy: { labelKey: "Personality", emoji: "🧠" },
  astro: { labelKey: "Astrology", emoji: "✨" },
};

const getProgressTone = (value: number): ProgressBarTone => {
  if (value < 30) return "danger";
  if (value < 50) return "warning";
  if (value < 70) return "accent";
  return "success";
};

interface DimensionItemProps {
  emoji: string;
  label: string;
  value: number;
}

const DimensionItem = ({ emoji, label, value }: DimensionItemProps) => {
  const tone = getProgressTone(value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <span>{emoji}</span>
          {label}
        </span>
        <span className="text-xs font-semibold text-foreground">{value}%</span>
      </div>
      <ProgressBar value={value} tone={tone} size="sm" />
    </div>
  );
};

interface DomainItemProps {
  emoji: string;
  label: string;
  value: number | null;
  missing: boolean;
}

const DomainItem = ({ emoji, label, value, missing }: DomainItemProps) => {
  const normalized = value == null ? 0 : value;
  const tone = missing ? "neutral" : getProgressTone(normalized);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className={cx(
            "flex items-center gap-1.5 text-xs font-medium",
            missing ? "text-subtle" : "text-foreground"
          )}
        >
          <span>{emoji}</span>
          {label}
        </span>
        <span
          className={cx(
            "text-xs font-semibold",
            missing ? "text-subtle" : "text-foreground"
          )}
        >
          {missing ? null : `${Math.round(normalized)}%`}
        </span>
      </div>
      <ProgressBar value={normalized} tone={tone} size="sm" />
    </div>
  );
};


export interface MatchBreakdownCardProps {
  breakdown?: MatchBreakdown | null;
  className?: string;
}

export const MatchBreakdownCard = ({ breakdown, className }: MatchBreakdownCardProps) => {
  const { t } = useT();

  if (!breakdown) {
    return null;
  }

  const { dimensions, completeness, availableDimensions, totalDimensions } = breakdown;
  const domainSlots = resolveMatchDomainSlots(breakdown);

  // Separa dimensioni disponibili e mancanti
  // Normalizza i valori negativi a 0
  const availableDims = (Object.keys(DIMENSION_CONFIG) as Array<keyof DimensionScores>)
    .filter((key) => dimensions?.[key] !== null && dimensions?.[key] !== undefined)
    .map((key) => ({
      key,
      value: Math.max(0, dimensions![key] as number),
      emoji: DIMENSION_CONFIG[key].emoji,
      label: t(DIMENSION_CONFIG[key].labelKey),
    }));

  const missingDims = (Object.keys(DIMENSION_CONFIG) as Array<keyof DimensionScores>)
    .filter((key) => dimensions?.[key] === null || dimensions?.[key] === undefined)
    .map((key) => t(DIMENSION_CONFIG[key].labelKey));

  // Se non c'e nulla, non mostrare
  if (availableDims.length === 0 && domainSlots.length === 0) {
    return null;
  }

  return (
    <div className={cx("space-y-4", className)}>
      {domainSlots.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-subtle">
                {t("Domain fit")}
              </h4>
            </div>
            <div className="space-y-3">
              {domainSlots.map((domain) => (
                <DomainItem
                  key={domain.domain}
                  emoji={domain.emoji}
                  label={t(domain.label)}
                  value={domain.score}
                  missing={domain.missing}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Dimensioni analizzate */}
      {availableDims.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-subtle">
                {t("Compatibility analysis")}
              </h4>
              {completeness !== undefined && (
                <span className="text-[11px] text-muted">
                  {t("{available}/{total} dimensions", {
                    available: availableDimensions ?? availableDims.length,
                    total: totalDimensions ?? 6,
                  })}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {availableDims.map(({ key, label, emoji, value }) => (
                <DimensionItem key={key} emoji={emoji} label={label} value={value} />
              ))}
            </div>
            {missingDims.length > 0 && (
              <p className="mt-3 text-[11px] text-subtle">
                <span className="text-muted">{t("Not analyzed:")}</span>{" "}
                {missingDims.join(", ")}
              </p>
            )}
          </div>
        </Card>
      )}

    </div>
  );
};
