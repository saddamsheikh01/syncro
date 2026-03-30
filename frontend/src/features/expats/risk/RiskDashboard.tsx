"use client";

import { useEffect } from "react";
import { useT } from "@/hooks";
import { useRisk } from "../../../hooks/expats/useRisk";
import BurnoutGauge from "../starterkit/BurnoutGauge";
import RiskIndicatorCard from "./RiskIndicatorCard";

const RISK_COLORS: Record<string, { color: string; bg: string }> = {
  LOW: { color: "#16a34a", bg: "#dcfce7" },
  MODERATE: { color: "#ca8a04", bg: "#fef9c3" },
  HIGH: { color: "#ea580c", bg: "#ffedd5" },
  CRITICAL: { color: "#dc2626", bg: "#fee2e2" },
};

export default function RiskDashboard() {
  const { t } = useT();
  const { isLoading, riskSnapshot, loadRiskIndicators } = useRisk();

  useEffect(() => {
    loadRiskIndicators();
  }, [loadRiskIndicators]);

  if (isLoading) {
    return (
      <div className="risk-dash risk-dash--loading">
        <p>{t("Loading risk indicators...")}</p>
      </div>
    );
  }

  if (!riskSnapshot) {
    return (
      <div className="risk-dash risk-dash--empty">
        <p>{t("Risk indicators will appear after you generate a Starter Kit or run a simulation.")}</p>
      </div>
    );
  }

  const indicators = riskSnapshot.riskIndicators as Record<string, string>;
  const overallCfg = RISK_COLORS[riskSnapshot.overallRiskLevel] ?? RISK_COLORS.LOW;

  const INDICATOR_META: Record<string, { icon: string; label: string }> = {
    financialRisk: { icon: "💰", label: "Financial Risk" },
    isolationRisk: { icon: "🏠", label: "Isolation Risk" },
    adaptationRisk: { icon: "🌍", label: "Adaptation Risk" },
    burnoutRisk: { icon: "🔥", label: "Burnout Risk" },
  };

  return (
    <>
      <div className="risk-dash">
        {/* Indicator cards */}
        <div className="risk-dash__cards">
          {Object.entries(indicators).map(([key, level]) => {
            const meta = INDICATOR_META[key] ?? { icon: "📊", label: key };
            return (
              <RiskIndicatorCard
                key={key}
                icon={meta.icon}
                label={meta.label}
                level={String(level)}
              />
            );
          })}
        </div>

        {/* Burnout gauge */}
        <div className="risk-dash__burnout">
          <h4 className="risk-dash__section-title">{t("Burnout Index")}</h4>
          <BurnoutGauge value={riskSnapshot.burnoutIndex} size={180} />
        </div>

        {/* Overall level */}
        <div className="risk-dash__overall">
          <span className="risk-dash__overall-label">{t("Overall Risk Level")}</span>
          <span
            className="risk-dash__overall-badge"
            style={{ color: overallCfg.color, background: overallCfg.bg }}
          >
            {riskSnapshot.overallRiskLevel}
          </span>
        </div>
      </div>
      <style>{`
        .risk-dash {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 28px;
        }
        .risk-dash--loading,
        .risk-dash--empty {
          text-align: center;
          padding: 48px 24px;
          color: #6c778a;
        }
        .risk-dash__cards {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .risk-dash__burnout {
          text-align: center;
          margin-bottom: 24px;
          padding: 16px 0;
          border-top: 1px solid #f0f3f8;
        }
        .risk-dash__section-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0 0 12px;
        }
        .risk-dash__overall {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 16px;
          background: #f8fafd;
          border-radius: 12px;
        }
        .risk-dash__overall-label {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
        }
        .risk-dash__overall-badge {
          padding: 6px 20px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 800;
          text-transform: uppercase;
        }
      `}</style>
    </>
  );
}
