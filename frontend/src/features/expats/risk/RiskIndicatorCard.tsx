"use client";

import { useT } from "@/hooks";

const LEVEL_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  LOW: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  MODERATE: { color: "#ca8a04", bg: "#fefce8", border: "#fef08a" },
  HIGH: { color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  CRITICAL: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

interface RiskIndicatorCardProps {
  label: string;
  level: string;
  icon: string;
}

export default function RiskIndicatorCard({ label, level, icon }: RiskIndicatorCardProps) {
  const { t } = useT();
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.LOW;

  return (
    <>
      <div className="risk-ind-card" style={{ background: style.bg, borderColor: style.border }}>
        <span className="risk-ind-card__icon">{icon}</span>
        <span className="risk-ind-card__label">{t(label)}</span>
        <span className="risk-ind-card__level" style={{ color: style.color }}>{level}</span>
      </div>
      <style>{`
        .risk-ind-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 16px;
          border: 1px solid;
          border-radius: 14px;
          flex: 1;
          min-width: 120px;
          text-align: center;
        }
        .risk-ind-card__icon {
          font-size: 1.5rem;
        }
        .risk-ind-card__label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
        }
        .risk-ind-card__level {
          font-size: 0.8125rem;
          font-weight: 800;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
}
