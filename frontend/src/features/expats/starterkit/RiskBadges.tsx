"use client";

import { useT } from "@/hooks";

const RISK_COLORS: Record<string, { color: string; bg: string }> = {
  LOW: { color: "#16a34a", bg: "#dcfce7" },
  MODERATE: { color: "#ca8a04", bg: "#fef9c3" },
  HIGH: { color: "#ea580c", bg: "#ffedd5" },
  CRITICAL: { color: "#dc2626", bg: "#fee2e2" },
};

interface RiskBadgesProps {
  indicators: Record<string, unknown>;
  overallRiskLevel: string;
}

const INDICATOR_LABELS: Record<string, string> = {
  financialRisk: "Financial Risk",
  isolationRisk: "Isolation Risk",
  adaptationRisk: "Adaptation Risk",
  burnoutRisk: "Burnout Risk",
};

export default function RiskBadges({ indicators, overallRiskLevel }: RiskBadgesProps) {
  const { t } = useT();
  const overallCfg = RISK_COLORS[overallRiskLevel] ?? RISK_COLORS.LOW;

  return (
    <>
      <div className="risk-badges">
        <div className="risk-badges__list">
          {Object.entries(indicators).map(([key, val]) => {
            const level = String(val);
            const cfg = RISK_COLORS[level] ?? RISK_COLORS.LOW;
            const label = INDICATOR_LABELS[key] ?? key;
            return (
              <div key={key} className="risk-badge-item">
                <span className="risk-badge-label">{t(label)}</span>
                <span className="risk-badge-value" style={{ color: cfg.color, background: cfg.bg }}>
                  {level}
                </span>
              </div>
            );
          })}
        </div>
        <div className="risk-badges__overall">
          <span className="risk-badges__overall-label">{t("Overall Risk")}</span>
          <span className="risk-badges__overall-value" style={{ color: overallCfg.color, background: overallCfg.bg }}>
            {overallRiskLevel}
          </span>
        </div>
      </div>
      <style>{`
        .risk-badges__list {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .risk-badge-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 100px;
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 12px;
          padding: 14px 12px;
        }
        .risk-badge-label {
          font-size: 0.75rem;
          color: #6c778a;
          font-weight: 600;
          text-align: center;
        }
        .risk-badge-value {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .risk-badges__overall {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 14px;
          background: #f8fafd;
          border-radius: 12px;
        }
        .risk-badges__overall-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0d1b36;
        }
        .risk-badges__overall-value {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.8125rem;
          font-weight: 800;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
}
