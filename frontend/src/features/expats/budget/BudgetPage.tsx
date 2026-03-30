"use client";

import { useEffect, useState } from "react";
import { useT } from "@/hooks";
import { useBudget } from "../../../hooks/expats/useBudget";
import { getCities } from "../../../services/expats";
import type { CityListItem, CreateBudgetSimulationRequest } from "../../../types/expats";
import BudgetPlanSelector from "./BudgetPlanSelector";
import BudgetSimulationForm from "./BudgetSimulationForm";
import BudgetSimulationResult from "./BudgetSimulationResult";
import SimulationHistory from "./SimulationHistory";
import BudgetTracking from "./BudgetTracking";

type Tab = "simulator" | "history" | "tracking";

export default function BudgetPage() {
  const { t } = useT();
  const {
    isLoading,
    latestSimulation,
    simulations,
    trackingEntries,
    runSimulation,
    loadSimulations,
    loadTrackingEntries,
  } = useBudget();

  const [selectedPlan, setSelectedPlan] = useState<string>("FREE");
  const [activeTab, setActiveTab] = useState<Tab>("simulator");
  const [cities, setCities] = useState<CityListItem[]>([]);

  useEffect(() => {
    getCities().then(setCities).catch(() => {});
    loadSimulations();
    loadTrackingEntries();
  }, [loadSimulations, loadTrackingEntries]);

  const handleSubmit = async (payload: CreateBudgetSimulationRequest) => {
    try {
      await runSimulation(payload);
    } catch {
      // error is in store
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "simulator", label: t("Simulator") },
    { key: "history", label: t("History") },
    { key: "tracking", label: t("Tracking") },
  ];

  return (
    <>
      <div className="budget-shell">
        <div className="budget-header">
          <h1 className="budget-title">{t("Budget Simulator")}</h1>
          <p className="budget-subtitle">
            {t("Simulate your relocation budget and track real expenses")}
          </p>
        </div>

        {/* Tab nav */}
        <div className="budget-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`budget-tab ${activeTab === tab.key ? "budget-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Simulator tab */}
        {activeTab === "simulator" && (
          <>
            <BudgetPlanSelector selected={selectedPlan} onSelect={setSelectedPlan} />
            <BudgetSimulationForm
              planCode={selectedPlan}
              cities={cities}
              isLoading={isLoading}
              onSubmit={handleSubmit}
            />
            {latestSimulation && <BudgetSimulationResult simulation={latestSimulation} />}
          </>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <SimulationHistory simulations={simulations} />
        )}

        {/* Tracking tab */}
        {activeTab === "tracking" && (
          <BudgetTracking entries={trackingEntries} simulations={simulations} />
        )}
      </div>
      <style>{`
        .budget-shell {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8faff 0%, #eef2f9 100%);
          padding: 32px 24px 64px;
          max-width: 960px;
          margin: 0 auto;
        }
        .budget-header {
          margin-bottom: 32px;
        }
        .budget-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 8px;
        }
        .budget-subtitle {
          font-size: 0.9375rem;
          color: #6c778a;
          margin: 0;
        }
        .budget-tabs {
          display: flex;
          gap: 4px;
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
        }
        .budget-tab {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          background: transparent;
          font-size: 0.875rem;
          font-weight: 600;
          color: #6c778a;
          cursor: pointer;
          transition: all 0.2s;
        }
        .budget-tab:hover {
          color: #0d1b36;
        }
        .budget-tab--active {
          background: #3b6bdc;
          color: #fff;
        }
      `}</style>
    </>
  );
}
