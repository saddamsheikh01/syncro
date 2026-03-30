"use client";

import { useState } from "react";
import { useT } from "@/hooks";
import type { BudgetSimulationResponse } from "../../../types/expats";
import MarginBadge from "./MarginBadge";
import StressGauge from "./StressGauge";

interface SimulationHistoryProps {
  simulations: BudgetSimulationResponse[];
}

const PLAN_FILTERS = ["ALL", "FREE", "PREMIUM", "SUPER_PRO"] as const;

const INPUT_LABELS: Record<string, string> = {
  planCode: "Plan",
  monthlyBudget: "Monthly Budget",
  monthlyIncome: "Monthly Income",
  household: "Household",
  desiredLifestyle: "Lifestyle",
  livingType: "Living Type",
  housingType: "Housing Type",
  projectionMonths: "Projection",
  savings: "Savings",
  hasPet: "Has Pet",
  numberOfChildren: "Children",
  eatingOutFrequency: "Eating Out",
  transportMode: "Transport",
  leisureLevel: "Leisure",
};

function formatValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") {
    if (key.toLowerCase().includes("budget") || key.toLowerCase().includes("income") || key.toLowerCase().includes("savings")) {
      return `€${val.toLocaleString()}`;
    }
    if (key === "projectionMonths") return `${val} months`;
    return val.toLocaleString();
  }
  if (typeof val === "string") return val.replace(/_/g, " ");
  return String(val);
}

export default function SimulationHistory({ simulations }: SimulationHistoryProps) {
  const { t } = useT();
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "ALL"
    ? simulations
    : simulations.filter((s) => s.planCode === filter);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <>
      <div className="sim-history">
        {/* Filters */}
        <div className="sim-history__filters">
          {PLAN_FILTERS.map((f) => (
            <button
              key={f}
              className={`sim-filter ${filter === f ? "sim-filter--active" : ""}`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f === "ALL" ? t("All") : f.replace("_", " ")}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="sim-history__empty">
            <p>{t("No simulations yet. Run your first budget simulation!")}</p>
          </div>
        )}

        {filtered.map((sim) => {
          const out = sim.outputPayload;
          const inp = sim.inputPayload;
          const cost = (out.estimatedMonthlyCost ?? out.totalMonthlyCost ?? 0) as number;
          const margin = (out.margin ?? out.monthlyBalance ?? 0) as number;
          const status = (out.marginStatus ?? out.balanceStatus ?? "sustainable") as string;
          const rent = (out.rent ?? (out.costBreakdown as Record<string, unknown>)?.rent ?? 0) as number;
          const living = (out.livingCost ?? out.livingExpenses ?? (out.costBreakdown as Record<string, unknown>)?.livingExpenses ?? 0) as number;
          const stressIndex = (out.stressIndex ?? 0) as number;
          const stressLevel = (out.stressLevel ?? "") as string;
          const cityName = (out.cityName ?? sim.cityName ?? "") as string;
          const country = (out.country ?? "") as string;
          const entryCost = out.entryCost as Record<string, unknown> | undefined;
          const recommendedBudget = (out.recommendedBudget ?? 0) as number;
          const isExpanded = expandedId === sim.id;

          return (
            <button
              key={sim.id}
              className={`sh-card ${isExpanded ? "sh-card--expanded" : ""}`}
              onClick={() => setExpandedId(isExpanded ? null : sim.id)}
              type="button"
            >
              {/* Header row */}
              <div className="sh-card__header">
                <div className="sh-card__left">
                  <span className="sh-card__date">{formatDate(sim.createdAt)}</span>
                  <span className="sh-card__plan">{sim.planCode.replace("_", " ")}</span>
                </div>
                <div className="sh-card__right">
                  <span className="sh-card__city">{cityName}{country ? `, ${country}` : ""}</span>
                  <MarginBadge status={status} />
                </div>
              </div>

              {/* Summary metrics */}
              <div className="sh-card__metrics">
                <div className="sh-metric">
                  <span className="sh-metric__label">{t("Monthly Cost")}</span>
                  <span className="sh-metric__value">€{cost.toLocaleString()}</span>
                </div>
                <div className="sh-metric">
                  <span className="sh-metric__label">{t("Margin")}</span>
                  <span className="sh-metric__value" style={{ color: margin >= 0 ? "#16a34a" : "#dc2626" }}>
                    {margin >= 0 ? "+" : ""}€{margin.toLocaleString()}
                  </span>
                </div>
                {rent > 0 && (
                  <div className="sh-metric">
                    <span className="sh-metric__label">{t("Rent")}</span>
                    <span className="sh-metric__value">€{rent.toLocaleString()}</span>
                  </div>
                )}
                {living > 0 && (
                  <div className="sh-metric">
                    <span className="sh-metric__label">{t("Living Costs")}</span>
                    <span className="sh-metric__value">€{living.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Expand arrow hint */}
              <div className="sh-card__expand-hint">
                <span className={`sh-arrow ${isExpanded ? "sh-arrow--open" : ""}`}>▾</span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="sh-detail" onClick={(e) => e.stopPropagation()}>
                  {/* Stress gauge (PREMIUM+) */}
                  {stressIndex > 0 && (
                    <div className="sh-detail__stress">
                      <StressGauge value={stressIndex} size={120} label={stressLevel} />
                      <div className="sh-detail__stress-info">
                        <span className="sh-detail__stress-label">{t("Stress Index")}</span>
                        <span className="sh-detail__stress-val" style={{
                          color: stressIndex <= 0.3 ? "#16a34a" : stressIndex <= 0.5 ? "#ca8a04" : stressIndex <= 0.7 ? "#ea580c" : "#dc2626"
                        }}>
                          {(stressIndex * 100).toFixed(0)}% — {stressLevel}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cost breakdown visual */}
                  {rent > 0 && (
                    <div className="sh-detail__breakdown">
                      <h4>{t("Cost Breakdown")}</h4>
                      <div className="sh-breakdown-bar">
                        <div className="sh-bar-segment sh-bar-segment--rent" style={{ flex: rent }}>
                          <span>{t("Rent")}</span>
                          <strong>€{rent.toLocaleString()}</strong>
                        </div>
                        <div className="sh-bar-segment sh-bar-segment--living" style={{ flex: living }}>
                          <span>{t("Living")}</span>
                          <strong>€{living.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Entry cost */}
                  {entryCost && (
                    <div className="sh-detail__section">
                      <h4>{t("Entry Cost")}</h4>
                      <div className="sh-detail__grid">
                        {entryCost.firstMonthRent != null && (
                          <div className="sh-detail__item">
                            <span>{t("First Month Rent")}</span>
                            <strong>€{Number(entryCost.firstMonthRent).toLocaleString()}</strong>
                          </div>
                        )}
                        {entryCost.deposit != null && (
                          <div className="sh-detail__item">
                            <span>{t("Deposit")}</span>
                            <strong>€{Number(entryCost.deposit).toLocaleString()}</strong>
                          </div>
                        )}
                        {entryCost.basicSetup != null && (
                          <div className="sh-detail__item">
                            <span>{t("Basic Setup")}</span>
                            <strong>€{Number(entryCost.basicSetup).toLocaleString()}</strong>
                          </div>
                        )}
                        {entryCost.totalEntryCost != null && (
                          <div className="sh-detail__item sh-detail__item--total">
                            <span>{t("Total Entry Cost")}</span>
                            <strong>€{Number(entryCost.totalEntryCost).toLocaleString()}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recommended budget */}
                  {recommendedBudget > 0 && (
                    <div className="sh-detail__recommended">
                      <span>{t("Recommended Budget")}</span>
                      <strong>€{recommendedBudget.toLocaleString()}</strong>
                    </div>
                  )}

                  {/* Simulation parameters */}
                  <div className="sh-detail__section">
                    <h4>{t("Simulation Parameters")}</h4>
                    <div className="sh-detail__params">
                      {Object.entries(inp)
                        .filter(([, v]) => v !== null && v !== undefined && v !== "")
                        .map(([key, val]) => (
                          <div key={key} className="sh-param">
                            <span className="sh-param__label">{t(INPUT_LABELS[key] ?? key)}</span>
                            <span className="sh-param__value">{formatValue(key, val)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <style>{`
        .sim-history__filters {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .sim-filter {
          padding: 6px 16px;
          border: 1px solid #e4e9f2;
          border-radius: 20px;
          background: #fff;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #6c778a;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sim-filter:hover {
          border-color: #3b6bdc;
          color: #3b6bdc;
        }
        .sim-filter--active {
          background: #3b6bdc;
          color: #fff;
          border-color: #3b6bdc;
        }
        .sim-history__empty {
          text-align: center;
          padding: 48px 24px;
          color: #6c778a;
          font-size: 0.9375rem;
        }

        /* Card */
        .sh-card {
          display: block;
          width: 100%;
          text-align: left;
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sh-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          border-color: #d0d8e8;
        }
        .sh-card--expanded {
          box-shadow: 0 6px 28px rgba(0,0,0,0.08);
          border-color: #c8d4ea;
        }
        .sh-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sh-card__left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sh-card__right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sh-card__date {
          font-size: 0.8125rem;
          color: #6c778a;
        }
        .sh-card__plan {
          padding: 3px 10px;
          border-radius: 8px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          background: #f0f4ff;
          color: #3b6bdc;
          letter-spacing: 0.03em;
        }
        .sh-card__city {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
        }

        /* Metrics row */
        .sh-card__metrics {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .sh-metric {
          background: #f8fafd;
          border-radius: 10px;
          padding: 10px 16px;
          flex: 1;
          min-width: 100px;
        }
        .sh-metric__label {
          display: block;
          font-size: 0.6875rem;
          color: #6c778a;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 2px;
        }
        .sh-metric__value {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0d1b36;
        }

        /* Expand hint */
        .sh-card__expand-hint {
          text-align: center;
          margin-top: 4px;
        }
        .sh-arrow {
          font-size: 0.875rem;
          color: #b0bcd4;
          transition: transform 0.2s;
          display: inline-block;
        }
        .sh-arrow--open {
          transform: rotate(180deg);
        }

        /* Detail */
        .sh-detail {
          margin-top: 16px;
          padding-top: 20px;
          border-top: 1px solid #f0f3f8;
        }

        /* Stress row */
        .sh-detail__stress {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          padding: 16px;
          background: #fafbfe;
          border-radius: 12px;
        }
        .sh-detail__stress-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sh-detail__stress-label {
          font-size: 0.75rem;
          color: #6c778a;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .sh-detail__stress-val {
          font-size: 1.125rem;
          font-weight: 800;
        }

        /* Cost breakdown bar */
        .sh-detail__breakdown {
          margin-bottom: 20px;
        }
        .sh-detail__breakdown h4 {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0 0 10px;
        }
        .sh-breakdown-bar {
          display: flex;
          border-radius: 10px;
          overflow: hidden;
          height: 56px;
        }
        .sh-bar-segment {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          color: #fff;
          font-size: 0.6875rem;
          min-width: 60px;
        }
        .sh-bar-segment strong {
          font-size: 0.8125rem;
        }
        .sh-bar-segment--rent {
          background: #3b6bdc;
        }
        .sh-bar-segment--living {
          background: #6b9fff;
        }

        /* Entry cost / sections */
        .sh-detail__section {
          margin-bottom: 20px;
        }
        .sh-detail__section h4 {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0 0 10px;
        }
        .sh-detail__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        @media (max-width: 480px) {
          .sh-detail__grid { grid-template-columns: 1fr; }
        }
        .sh-detail__item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #f8fafd;
          border-radius: 8px;
          font-size: 0.8125rem;
          color: #475569;
        }
        .sh-detail__item strong {
          color: #0d1b36;
          font-weight: 700;
        }
        .sh-detail__item--total {
          grid-column: 1 / -1;
          background: #f0f4ff;
          font-weight: 600;
        }
        .sh-detail__item--total strong {
          color: #3b6bdc;
          font-size: 0.9375rem;
        }

        /* Recommended budget */
        .sh-detail__recommended {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          background: linear-gradient(135deg, #f0f4ff, #e8eeff);
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.875rem;
          color: #475569;
        }
        .sh-detail__recommended strong {
          font-size: 1.125rem;
          font-weight: 800;
          color: #3b6bdc;
        }

        /* Parameters */
        .sh-detail__params {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .sh-param {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: #f8fafd;
          border-radius: 20px;
          font-size: 0.75rem;
        }
        .sh-param__label {
          color: #6c778a;
        }
        .sh-param__value {
          color: #0d1b36;
          font-weight: 700;
          text-transform: capitalize;
        }
      `}</style>
    </>
  );
}
