"use client";

import { Card } from "@/components/elements/Card";
import { ProgressBar, type ProgressBarTone } from "@/components/elements/ProgressBar";
import type { DimensionScores, MatchBreakdown } from "@/types/matches";
import { cx } from "@/lib/classNames";

const DIMENSION_CONFIG: Record<keyof DimensionScores, { label: string; emoji: string }> = {
  interests: { label: "Interessi", emoji: "💫" },
  lifestyle: { label: "Stile di vita", emoji: "🏃" },
  values: { label: "Valori", emoji: "💎" },
  objectives: { label: "Obiettivi", emoji: "🎯" },
  psy: { label: "Personalita", emoji: "🧠" },
  astro: { label: "Astrologia", emoji: "✨" },
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


export interface MatchBreakdownCardProps {
  breakdown?: MatchBreakdown | null;
  className?: string;
}

export const MatchBreakdownCard = ({ breakdown, className }: MatchBreakdownCardProps) => {
  if (!breakdown) {
    return null;
  }

  const { dimensions, completeness, availableDimensions, totalDimensions } = breakdown;

  // Separa dimensioni disponibili e mancanti
  const availableDims = (Object.keys(DIMENSION_CONFIG) as Array<keyof DimensionScores>)
    .filter((key) => dimensions?.[key] !== null && dimensions?.[key] !== undefined)
    .map((key) => ({ key, value: dimensions![key] as number, ...DIMENSION_CONFIG[key] }));

  const missingDims = (Object.keys(DIMENSION_CONFIG) as Array<keyof DimensionScores>)
    .filter((key) => dimensions?.[key] === null || dimensions?.[key] === undefined)
    .map((key) => DIMENSION_CONFIG[key].label);

  // Se non c'e nulla, non mostrare
  if (availableDims.length === 0) {
    return null;
  }

  return (
    <div className={cx("space-y-4", className)}>
      {/* Dimensioni analizzate */}
      {availableDims.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-subtle">
                Analisi compatibilita
              </h4>
              {completeness !== undefined && (
                <span className="text-[11px] text-muted">
                  {availableDimensions ?? availableDims.length}/{totalDimensions ?? 6} dimensioni
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
                <span className="text-muted">Non analizzati:</span> {missingDims.join(", ")}
              </p>
            )}
          </div>
        </Card>
      )}

    </div>
  );
};
