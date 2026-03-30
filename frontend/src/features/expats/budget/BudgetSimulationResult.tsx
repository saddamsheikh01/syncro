"use client";

import { useT } from "@/hooks";
import type { BudgetSimulationResponse } from "../../../types/expats";
import MarginBadge from "./MarginBadge";
import StressGauge from "./StressGauge";
import ProjectionChart from "./ProjectionChart";

interface BudgetSimulationResultProps {
  simulation: BudgetSimulationResponse;
}

interface ProjectionPoint {
  month: number;
  monthlySaving: number;
  cumulativeSavings: number;
}

export default function BudgetSimulationResult({ simulation }: BudgetSimulationResultProps) {
  const { t } = useT();
  const out = simulation.outputPayload;
  const plan = simulation.planCode;

  const estimatedCost = (out.estimatedMonthlyCost ?? out.totalMonthlyCost ?? 0) as number;
  const margin = (out.margin ?? out.monthlyBalance ?? 0) as number;
  const marginStatus = (out.marginStatus ?? out.balanceStatus ?? "sustainable") as string;
  const stressIndex = (out.stressIndex ?? 0) as number;
  const stressLevel = (out.stressLevel ?? "") as string;
  const cityName = (out.cityName ?? simulation.cityName ?? "") as string;
  const country = (out.country ?? "") as string;

  const costBreakdown = out.costBreakdown as { rent?: number; livingExpenses?: number; totalCost?: number } | undefined;
  const projections = (out.projections ?? out.timeSimulation ?? []) as ProjectionPoint[];
  const optimizationPlan = (out.optimizationPlan ?? []) as string[];
  const safetyPlan = (out.relocationSafetyPlan ?? []) as string[];

  return (
    <>
      <div className="sim-result">
        {/* Header */}
        <div className="sim-result__header">
          <div>
            <h3 className="sim-result__city">{cityName}{country ? `, ${country}` : ""}</h3>
            <span className="sim-result__plan-tag">{plan}</span>
          </div>
          <MarginBadge status={marginStatus} />
        </div>

        {/* Core metrics */}
        <div className="sim-result__metrics">
          <div className="sim-metric">
            <span className="sim-metric__label">{t("Estimated Monthly Cost")}</span>
            <span className="sim-metric__value">€{estimatedCost.toLocaleString()}</span>
          </div>
          <div className="sim-metric">
            <span className="sim-metric__label">{t("Margin")}</span>
            <span className="sim-metric__value" style={{ color: margin >= 0 ? "#16a34a" : "#dc2626" }}>
              {margin >= 0 ? "+" : ""}€{margin.toLocaleString()}
            </span>
          </div>
        </div>

        {/* PREMIUM: Stress Index */}
        {(plan === "PREMIUM" || plan === "SUPER_PRO") && stressIndex > 0 && (
          <div className="sim-result__section">
            <h4 className="sim-result__section-title">{t("Stress Index")}</h4>
            <div className="sim-result__stress-row">
              <StressGauge value={stressIndex} size={140} label={stressLevel} />
              {costBreakdown && (
                <div className="sim-result__breakdown">
                  <div className="sim-breakdown-item">
                    <span>{t("Rent")}</span>
                    <strong>€{(costBreakdown.rent ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="sim-breakdown-item">
                    <span>{t("Living Expenses")}</span>
                    <strong>€{(costBreakdown.livingExpenses ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="sim-breakdown-item sim-breakdown-item--total">
                    <span>{t("Total")}</span>
                    <strong>€{(costBreakdown.totalCost ?? 0).toLocaleString()}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUPER_PRO: Projections */}
        {plan === "SUPER_PRO" && projections.length > 0 && (
          <div className="sim-result__section">
            <h4 className="sim-result__section-title">{t("Savings Projections")}</h4>
            <ProjectionChart projections={projections} />
          </div>
        )}

        {/* SUPER_PRO: Optimization Plan */}
        {plan === "SUPER_PRO" && optimizationPlan.length > 0 && (
          <div className="sim-result__section">
            <h4 className="sim-result__section-title">{t("Optimization Plan")}</h4>
            <ul className="sim-result__list">
              {optimizationPlan.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* SUPER_PRO: Safety Plan */}
        {plan === "SUPER_PRO" && safetyPlan.length > 0 && (
          <div className="sim-result__section">
            <h4 className="sim-result__section-title">{t("Relocation Safety Plan")}</h4>
            <ul className="sim-result__checklist">
              {safetyPlan.map((item, i) => (
                <li key={i}>
                  <span className="sim-check-icon">☐</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <style>{`
        .sim-result {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
        }
        .sim-result__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .sim-result__city {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 6px;
        }
        .sim-result__plan-tag {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 8px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          background: #f0f4ff;
          color: #3b6bdc;
        }
        .sim-result__metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .sim-metric {
          background: #f8fafd;
          border-radius: 12px;
          padding: 16px;
        }
        .sim-metric__label {
          display: block;
          font-size: 0.75rem;
          color: #6c778a;
          margin-bottom: 4px;
        }
        .sim-metric__value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0d1b36;
        }
        .sim-result__section {
          border-top: 1px solid #f0f3f8;
          padding-top: 20px;
          margin-top: 20px;
        }
        .sim-result__section-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0 0 16px;
        }
        .sim-result__stress-row {
          display: flex;
          align-items: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .sim-result__breakdown {
          flex: 1;
          min-width: 200px;
        }
        .sim-breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 0.875rem;
          color: #475569;
          border-bottom: 1px solid #f0f3f8;
        }
        .sim-breakdown-item--total {
          border-bottom: none;
          font-weight: 700;
          color: #0d1b36;
        }
        .sim-result__list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sim-result__list li {
          padding: 8px 0 8px 24px;
          position: relative;
          font-size: 0.875rem;
          color: #475569;
          border-bottom: 1px solid #f8fafd;
        }
        .sim-result__list li::before {
          content: "💡";
          position: absolute;
          left: 0;
        }
        .sim-result__checklist {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sim-result__checklist li {
          padding: 10px 0;
          font-size: 0.875rem;
          color: #475569;
          border-bottom: 1px solid #f8fafd;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sim-check-icon {
          font-size: 1.1rem;
          color: #3b6bdc;
        }
      `}</style>
    </>
  );
}
