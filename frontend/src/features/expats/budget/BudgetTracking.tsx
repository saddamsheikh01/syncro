"use client";

import { useState } from "react";
import { useT } from "@/hooks";
import { useBudget } from "../../../hooks/expats/useBudget";
import type { BudgetTrackingResponse, BudgetSimulationResponse } from "../../../types/expats";
import AlertBadge from "./AlertBadge";

const CATEGORIES = [
  "rent", "groceries", "transport", "utilities", "dining",
  "entertainment", "healthcare", "insurance", "education", "other",
];

interface BudgetTrackingProps {
  entries: BudgetTrackingResponse[];
  simulations: BudgetSimulationResponse[];
}

export default function BudgetTracking({ entries, simulations }: BudgetTrackingProps) {
  const { t } = useT();
  const { isLoading, createTrackingEntry } = useBudget();

  const [category, setCategory] = useState<string>("rent");
  const [expectedValue, setExpectedValue] = useState<string>("");
  const [actualValue, setActualValue] = useState<string>("");
  const [threshold, setThreshold] = useState<string>("");
  const [simulationId, setSimulationId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrackingEntry({
        category,
        expectedValue: expectedValue ? Number(expectedValue) : null,
        actualValue: actualValue ? Number(actualValue) : null,
        threshold: threshold ? Number(threshold) : null,
        simulationId: simulationId || null,
      });
      setExpectedValue("");
      setActualValue("");
      setThreshold("");
      setShowForm(false);
    } catch {
      // error in store
    }
  };

  // Group entries by category
  const grouped = entries.reduce<Record<string, BudgetTrackingResponse[]>>((acc, entry) => {
    const key = entry.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const totalExpected = entries.reduce((s, e) => s + e.expectedValue, 0);
  const totalActual = entries.reduce((s, e) => s + e.actualValue, 0);
  const activeAlerts = entries.filter((e) => e.alertStatus === "WARNING" || e.alertStatus === "OVER_BUDGET").length;

  return (
    <>
      <div className="tracking">
        {/* Summary */}
        <div className="tracking__summary">
          <div className="tracking__stat">
            <span className="tracking__stat-label">{t("Total Expected")}</span>
            <span className="tracking__stat-value">€{totalExpected.toLocaleString()}</span>
          </div>
          <div className="tracking__stat">
            <span className="tracking__stat-label">{t("Total Actual")}</span>
            <span className="tracking__stat-value">€{totalActual.toLocaleString()}</span>
          </div>
          <div className="tracking__stat">
            <span className="tracking__stat-label">{t("Active Alerts")}</span>
            <span className="tracking__stat-value" style={{ color: activeAlerts > 0 ? "#dc2626" : "#16a34a" }}>
              {activeAlerts}
            </span>
          </div>
        </div>

        {/* Add entry button */}
        <button
          className="tracking__add-btn"
          onClick={() => setShowForm(!showForm)}
          type="button"
        >
          {showForm ? t("Cancel") : t("+ Add Tracking Entry")}
        </button>

        {/* Form */}
        {showForm && (
          <form className="tracking__form" onSubmit={handleSubmit}>
            <div className="tracking__form-grid">
              <div className="tracking__field">
                <label>{t("Category")}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t(c.charAt(0).toUpperCase() + c.slice(1))}</option>
                  ))}
                </select>
              </div>
              <div className="tracking__field">
                <label>{t("Expected")} (EUR)</label>
                <input type="number" min={0} step={10} value={expectedValue} onChange={(e) => setExpectedValue(e.target.value)} />
              </div>
              <div className="tracking__field">
                <label>{t("Actual")} (EUR)</label>
                <input type="number" min={0} step={10} value={actualValue} onChange={(e) => setActualValue(e.target.value)} />
              </div>
              <div className="tracking__field">
                <label>{t("Alert Threshold")} (EUR)</label>
                <input type="number" min={0} step={10} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </div>
              {simulations.length > 0 && (
                <div className="tracking__field">
                  <label>{t("Link Simulation")}</label>
                  <select value={simulationId} onChange={(e) => setSimulationId(e.target.value)}>
                    <option value="">{t("None")}</option>
                    {simulations.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.cityName} – {s.planCode} – {new Date(s.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button className="tracking__submit" type="submit" disabled={isLoading}>
              {isLoading ? t("Saving...") : t("Save Entry")}
            </button>
          </form>
        )}

        {/* Grouped entries */}
        {Object.keys(grouped).length === 0 && !showForm && (
          <div className="tracking__empty">
            <p>{t("No tracking entries yet. Start tracking your expenses!")}</p>
          </div>
        )}

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="tracking__group">
            <h3 className="tracking__group-title">{t(cat.charAt(0).toUpperCase() + cat.slice(1))}</h3>
            {items.map((entry) => (
              <div key={entry.id} className="tracking__entry">
                <div className="tracking__entry-row">
                  <div>
                    <span className="tracking__entry-date">
                      {new Date(entry.recordedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <AlertBadge status={entry.alertStatus} />
                </div>
                <div className="tracking__entry-values">
                  <span>{t("Expected")}: €{entry.expectedValue.toLocaleString()}</span>
                  <span>{t("Actual")}: €{entry.actualValue.toLocaleString()}</span>
                  <span style={{ color: entry.delta >= 0 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>
                    {t("Delta")}: {entry.delta >= 0 ? "+" : ""}€{entry.delta.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        .tracking__summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 640px) {
          .tracking__summary {
            grid-template-columns: 1fr;
          }
        }
        .tracking__stat {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }
        .tracking__stat-label {
          display: block;
          font-size: 0.75rem;
          color: #6c778a;
          margin-bottom: 4px;
        }
        .tracking__stat-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0d1b36;
        }
        .tracking__add-btn {
          display: block;
          width: 100%;
          padding: 12px;
          background: #f0f4ff;
          border: 2px dashed #3b6bdc;
          border-radius: 12px;
          color: #3b6bdc;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 20px;
          transition: background 0.2s;
        }
        .tracking__add-btn:hover {
          background: #e0e8ff;
        }
        .tracking__form {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .tracking__form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (max-width: 640px) {
          .tracking__form-grid {
            grid-template-columns: 1fr;
          }
        }
        .tracking__field label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }
        .tracking__field input,
        .tracking__field select {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e4e9f2;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #0d1b36;
          background: #f8fafd;
        }
        .tracking__field input:focus,
        .tracking__field select:focus {
          outline: none;
          border-color: #3b6bdc;
          box-shadow: 0 0 0 3px rgba(59, 107, 220, 0.1);
        }
        .tracking__submit {
          width: 100%;
          padding: 12px;
          background: #3b6bdc;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .tracking__submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .tracking__empty {
          text-align: center;
          padding: 48px 24px;
          color: #6c778a;
        }
        .tracking__group {
          margin-bottom: 20px;
        }
        .tracking__group-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0 0 12px;
          text-transform: capitalize;
        }
        .tracking__entry {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 8px;
        }
        .tracking__entry-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .tracking__entry-date {
          font-size: 0.8125rem;
          color: #6c778a;
        }
        .tracking__entry-values {
          display: flex;
          gap: 20px;
          font-size: 0.8125rem;
          color: #475569;
          flex-wrap: wrap;
        }
      `}</style>
    </>
  );
}
