"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useT } from "@/hooks";
import { useBudget } from "../../../hooks/expats/useBudget";
import { getCities } from "../../../services/expats";
import type { CityListItem } from "../../../types/expats";
import SimulationHistory from "./SimulationHistory";
import BudgetTracking from "./BudgetTracking";
import PlanTabs from "../shared/PlanTabs";
import { RegistrationRequiredModal } from "@/components/ui/RegistrationRequiredModal";
import { useRegistrationGate } from "../../../hooks/expats/useRegistrationGate";

type HousingType = "1br_center" | "3br_center";
type LivingType = "single" | "family";

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

  const [budget, setBudget] = useState(2000);
  const [savings, setSavings] = useState(0);
  const [housingType, setHousingType] = useState<HousingType>("1br_center");
  const [livingType, setLivingType] = useState<LivingType>("single");
  const [cityId, setCityId] = useState<string>("");
  const [cities, setCities] = useState<CityListItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isModalOpen, modalMessage, openGate, closeModal, gatedAction } = useRegistrationGate();

  useEffect(() => {
    // Load silently — if 403 (anonymous), just ignore
    loadSimulations().catch(() => {});
    loadTrackingEntries().catch(() => {});
    getCities().then(setCities).catch(() => {});
  }, [loadSimulations, loadTrackingEntries]);

  const triggerSimulation = useCallback((b: number, s: number, h: HousingType, l: LivingType, c: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSimulation({
        planCode: "FREE",
        monthlyBudget: b,
        savings: s > 0 ? s : null,
        housingType: h,
        livingType: l,
        cityId: c || null,
      }).catch(() => {});
    }, 600);
  }, [runSimulation]);

  // Auto-run on mount
  useEffect(() => {
    triggerSimulation(budget, savings, housingType, livingType, cityId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBudgetChange = (val: number) => {
    setBudget(val);
    triggerSimulation(val, savings, housingType, livingType, cityId);
  };

  const handleSavingsChange = (val: number) => {
    setSavings(val);
    triggerSimulation(budget, val, housingType, livingType, cityId);
  };

  const handleHousingChange = (val: HousingType) => {
    setHousingType(val);
    triggerSimulation(budget, savings, val, livingType, cityId);
  };

  const handleLivingChange = (val: LivingType) => {
    setLivingType(val);
    triggerSimulation(budget, savings, housingType, val, cityId);
  };

  const handleCityChange = (val: string) => {
    setCityId(val);
    triggerSimulation(budget, savings, housingType, livingType, val);
  };

  const out = latestSimulation?.outputPayload ?? {};
  const totalCost = (out.estimatedMonthlyCost ?? out.totalMonthlyCost ?? 0) as number;
  const rent = (out.rent ?? 0) as number;
  const entryCost = out.entryCost as Record<string, number> | undefined;
  const monthlyBalance = (out.monthlyBalance ?? (budget - totalCost)) as number;
  const recommendedBudget = (out.recommendedBudget ?? 0) as number;
  const financialRunway = out.financialRunway as { months: number; level: string } | undefined;

  const runwayLevel = financialRunway?.level ?? (savings <= 0 ? "—" : monthlyBalance < 0 ? "Critical" : "Good");
  const runwayMonths = financialRunway?.months ?? null;

  return (
    <>
      <div className="bp-shell">
        <h1 className="bp-title">{t("Budget Simulator")}</h1>

        <PlanTabs onLockedClick={(ctx) => openGate(ctx)} />

        {/* ── Cost Breakdown ────────────────────────────────── */}
        <div className="bp-card">
          <h2 className="bp-card__title">{t("Cost Breakdown")}</h2>

          {/* City Select */}
          <div className="bp-field">
            <div className="bp-field__header">
              <span className="bp-field__icon">📍</span>
              <span className="bp-field__label">{t("Target City")}</span>
            </div>
            <select
              className="bp-select"
              value={cityId}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value="">{t("Use profile city")}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>{c.cityName}, {c.country}</option>
              ))}
            </select>
          </div>

          {/* Monthly Budget Slider */}
          <div className="bp-field">
            <div className="bp-field__header">
              <span className="bp-field__icon">🏡</span>
              <span className="bp-field__label">{t("Monthly Budget")}</span>
            </div>
            <div className="bp-slider-wrap">
              <input
                type="range"
                min={300}
                max={10000}
                step={50}
                value={budget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="bp-slider"
              />
              <div className="bp-slider__bubble" style={{ left: `${((budget - 300) / (10000 - 300)) * 100}%` }}>
                €{budget.toLocaleString("de-DE")}
              </div>
            </div>
            <div className="bp-slider__range">
              <span>€ 300</span>
              <span>+ € 10.000</span>
            </div>
          </div>

          {/* Savings Slider */}
          <div className="bp-field">
            <div className="bp-field__header">
              <span className="bp-field__icon">💰</span>
              <span className="bp-field__label">{t("Total Savings")}</span>
            </div>
            <div className="bp-slider-wrap">
              <input
                type="range"
                min={0}
                max={50000}
                step={500}
                value={savings}
                onChange={(e) => handleSavingsChange(Number(e.target.value))}
                className="bp-slider"
              />
              <div className="bp-slider__bubble" style={{ left: `${(savings / 50000) * 100}%` }}>
                €{savings.toLocaleString("de-DE")}
              </div>
            </div>
            <div className="bp-slider__range">
              <span>€ 0</span>
              <span>€ 50.000</span>
            </div>
          </div>

          {/* Housing Type */}
          <div className="bp-field">
            <div className="bp-field__header">
              <span className="bp-field__icon">🏠</span>
              <span className="bp-field__label">{t("Housing Type")}</span>
            </div>
            <div className="bp-toggles">
              <button
                className={`bp-toggle ${housingType === "1br_center" ? "bp-toggle--active" : ""}`}
                onClick={() => handleHousingChange("1br_center")}
                type="button"
              >
                {t("Apartment 1 Room")}
              </button>
              <button
                className={`bp-toggle ${housingType === "3br_center" ? "bp-toggle--active" : ""}`}
                onClick={() => handleHousingChange("3br_center")}
                type="button"
              >
                {t("Apartment 3 Room")}
              </button>
            </div>
          </div>

          {/* Daily Living Cost */}
          <div className="bp-field">
            <div className="bp-field__header">
              <span className="bp-field__icon">🛒</span>
              <span className="bp-field__label">{t("Daily Living Cost")}</span>
            </div>
            <div className="bp-toggles">
              <button
                className={`bp-toggle ${livingType === "single" ? "bp-toggle--active" : ""}`}
                onClick={() => handleLivingChange("single")}
                type="button"
              >
                {t("Single")}
              </button>
              <button
                className={`bp-toggle ${livingType === "family" ? "bp-toggle--active" : ""}`}
                onClick={() => handleLivingChange("family")}
                type="button"
              >
                {t("Family")}
              </button>
            </div>
          </div>

          {/* Total Monthly Cost */}
          <div className="bp-total">
            <span className="bp-total__label">{t("Total Monthly Cost")}</span>
            <span className="bp-total__value">
              {isLoading ? "..." : `€ ${totalCost.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>

        {/* ── Grid: Entry Cost + Reality Check ──────────────── */}
        <div className="bp-grid">

        {/* ── Entry Cost ────────────────────────────────────── */}
        {entryCost && (
          <div className="bp-card">
            <h2 className="bp-card__title">{t("Entry Cost")}</h2>
            <div className="bp-entry-list">
              <div className="bp-entry-item">
                <span>🏠 {t("First Month Rent")}</span>
                <span className="bp-entry-val">€{(entryCost.firstMonthRent ?? rent).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bp-entry-item">
                <span>💰 {t("Deposit")} (2 {t("months")})</span>
                <span className="bp-entry-val">€{(entryCost.deposit ?? rent * 2).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bp-entry-item">
                <span>🎆 {t("Basic Setup")} ({t("Furniture / SIM Etc.")})</span>
                <span className="bp-entry-val">€{(entryCost.basicSetup ?? 500).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bp-entry-item bp-entry-item--total">
                <span>📊 <strong>{t("Total Estimated Entry Cost")}</strong></span>
                <span className="bp-entry-val bp-entry-val--total">€{(entryCost.totalEntryCost ?? 0).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Reality Check ─────────────────────────────────── */}
        <div className="bp-card">
          <h2 className="bp-card__title">{t("Reality Check")}</h2>
          <p className="bp-reality__headline">
            <strong>{t("Can You Really Afford This Move?")}</strong>
          </p>
          <p className="bp-reality__sub">
            {t("Here's What Happens Based On Your Real Numbers — Not Estimates.")}
          </p>

          <div className="bp-reality-list">
            {/* Monthly Deficit / Surplus */}
            <div className="bp-reality-item">
              <div className="bp-reality-item__left">
                <span className="bp-reality-dot" style={{ background: monthlyBalance < 0 ? "#dc2626" : "#16a34a" }} />
                <div>
                  <strong>{monthlyBalance < 0 ? t("Monthly Deficit") : t("Monthly Surplus")}:</strong>
                  <p className="bp-reality-item__desc">
                    {monthlyBalance < 0
                      ? t("You Are Currently Running At A Loss Based On Your Expected Cost Of Living.")
                      : t("Your budget covers your estimated monthly costs.")}
                  </p>
                </div>
              </div>
              <span className="bp-reality-item__val" style={{ color: monthlyBalance < 0 ? "#dc2626" : "#16a34a" }}>
                {monthlyBalance >= 0 ? "+" : ""}€{monthlyBalance.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Financial Runway */}
            <div className="bp-reality-item">
              <div className="bp-reality-item__left">
                <span className="bp-reality-dot" style={{ background: runwayLevel === "Critical" || runwayLevel === "CRITICAL" ? "#dc2626" : runwayLevel === "MODERATE" ? "#ca8a04" : "#16a34a" }} />
                <div>
                  <strong>
                    {t("Financial Runway")}
                    {runwayMonths !== null && (
                      <> — <span style={{ color: runwayLevel === "Critical" || runwayLevel === "CRITICAL" ? "#dc2626" : runwayLevel === "MODERATE" ? "#ca8a04" : "#16a34a" }}>{t(runwayLevel)}</span></>
                    )}
                  </strong>
                  <p className="bp-reality-item__desc">{t("How Long Can You Live Without Income?")}</p>
                </div>
              </div>
              <span className="bp-reality-item__val">
                {runwayMonths !== null
                  ? `${runwayMonths} ${t("Months")}`
                  : t("Add savings above")}
              </span>
            </div>

            {/* Recommended Budget */}
            <div className="bp-reality-item">
              <div className="bp-reality-item__left">
                <span className="bp-reality-dot" style={{ background: "#3b6bdc" }} />
                <div>
                  <strong>{t("Recommended Budget")}</strong>
                  <p className="bp-reality-item__desc">
                    {t("This Is The Monthly Income You Need To Live Comfortably In This City Without Financial Stress.")}
                  </p>
                </div>
              </div>
              <span className="bp-reality-item__val" style={{ color: "#3b6bdc" }}>
                €{recommendedBudget.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        </div>{/* close bp-grid */}

        {/* ── CTA ───────────────────────────────────────────── */}
        <button className="bp-cta" type="button" disabled>
          👉 {t("Talk To A Relocation Expert")} <span className="bp-coming">Coming Soon</span>
        </button>

        {/* ── History toggle ─────────────────────────────────── */}
        <button
          className="bp-history-link"
          onClick={() => gatedAction(() => { setShowHistory(!showHistory); return Promise.resolve(); }, "simulation_history").catch(() => {})}
          type="button"
        >
          {showHistory ? t("Hide Simulation History") : t("View Simulation History")} ({simulations.length})
        </button>

        {showHistory && <SimulationHistory simulations={simulations} />}

        {/* ── Tracking toggle ────────────────────────────────── */}
        <button
          className="bp-history-link"
          onClick={() => gatedAction(() => { setShowTracking(!showTracking); return Promise.resolve(); }, "budget_tracking").catch(() => {})}
          type="button"
        >
          {showTracking ? t("Hide Expense Tracking") : t("Track Your Real Expenses")} ({trackingEntries.length})
        </button>

        {showTracking && <BudgetTracking entries={trackingEntries} simulations={simulations} />}
      </div>
      <style>{`
        .bp-shell {
          max-width: 960px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }
        .bp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .bp-grid > .bp-card {
          margin-bottom: 0;
        }
        @media (max-width: 768px) {
          .bp-grid {
            grid-template-columns: 1fr;
          }
        }
        .bp-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 28px;
        }

        /* Card */
        .bp-card {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 20px;
        }
        .bp-card__title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 24px;
        }

        /* Field */
        .bp-field {
          margin-bottom: 28px;
        }
        .bp-field__header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .bp-field__icon {
          font-size: 1.5rem;
        }
        .bp-field__label {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
        }

        /* Select */
        .bp-select {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e4e9f2;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0d1b36;
          background: #f8fafd;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .bp-select:focus {
          outline: none;
          border-color: #3b6bdc;
          box-shadow: 0 0 0 3px rgba(59, 107, 220, 0.1);
        }

        /* Slider */
        .bp-slider-wrap {
          position: relative;
          padding-top: 32px;
          margin-bottom: 8px;
        }
        .bp-slider {
          width: 100%;
          height: 6px;
          appearance: none;
          background: #e4e9f2;
          border-radius: 3px;
          outline: none;
        }
        .bp-slider::-webkit-slider-thumb {
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #3b6bdc;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(59, 107, 220, 0.3);
        }
        .bp-slider__bubble {
          position: absolute;
          top: 0;
          transform: translateX(-50%);
          background: #3b6bdc;
          color: #fff;
          padding: 4px 14px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 700;
          white-space: nowrap;
          pointer-events: none;
        }
        .bp-slider__range {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #6c778a;
        }

        /* Toggle buttons */
        .bp-toggles {
          display: flex;
          gap: 12px;
        }
        .bp-toggle {
          flex: 1;
          padding: 12px 20px;
          border: 1px solid #e4e9f2;
          border-radius: 12px;
          background: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          color: #6c778a;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bp-toggle:hover:not(.bp-toggle--active) {
          border-color: #3b6bdc;
          color: #3b6bdc;
        }
        .bp-toggle--active {
          background: #3b6bdc;
          color: #fff;
          border-color: #3b6bdc;
        }
        .bp-toggle--active:hover {
          background: #2d5bc7;
          color: #fff;
        }

        /* Total */
        .bp-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1px solid #f0f3f8;
        }
        .bp-total__label {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0d1b36;
        }
        .bp-total__value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0d1b36;
        }

        /* Locked card */
        .bp-card--locked {
          position: relative;
          overflow: hidden;
        }
        .bp-locked-overlay {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 20px 16px 24px;
        }
        .bp-locked__icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 10px;
        }
        .bp-locked__title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 8px;
        }
        .bp-locked__desc {
          font-size: 0.8125rem;
          color: #6c778a;
          line-height: 1.5;
          margin: 0 0 14px;
          max-width: 360px;
          margin-left: auto;
          margin-right: auto;
        }
        .bp-locked__badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: #fef9c3;
          color: #a16207;
        }
        .bp-locked-preview {
          position: relative;
          z-index: 1;
          opacity: 0.25;
          filter: blur(2px);
          pointer-events: none;
          user-select: none;
          padding: 0 4px 8px;
        }
        .bp-locked-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f3f8;
          font-size: 0.875rem;
          color: #475569;
        }
        .bp-locked-row:last-child {
          border-bottom: none;
        }

        /* Reality locked item */
        .bp-reality-item--locked {
          opacity: 0.5;
        }
        .bp-reality-premium-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          background: #fef9c3;
          color: #a16207;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Entry Cost */
        .bp-entry-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .bp-entry-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid #f0f3f8;
          font-size: 0.9375rem;
          color: #475569;
        }
        .bp-entry-item:last-child {
          border-bottom: none;
          padding-top: 18px;
        }
        .bp-entry-item--total {
          color: #0d1b36;
        }
        .bp-entry-val {
          font-weight: 600;
          color: #0d1b36;
          white-space: nowrap;
        }
        .bp-entry-val--total {
          font-size: 1.125rem;
          font-weight: 800;
        }

        /* Reality Check */
        .bp-reality__headline {
          font-size: 1.25rem;
          color: #0d1b36;
          margin: 0 0 4px;
          line-height: 1.4;
        }
        .bp-reality__sub {
          font-size: 0.875rem;
          color: #6c778a;
          margin: 0 0 24px;
          line-height: 1.5;
        }
        .bp-reality-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .bp-reality-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .bp-reality-item__left {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          flex: 1;
        }
        .bp-reality-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .bp-reality-item__desc {
          font-size: 0.8125rem;
          color: #6c778a;
          margin: 4px 0 0;
          line-height: 1.4;
        }
        .bp-reality-item__val {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0d1b36;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* CTA */
        .bp-cta {
          display: block;
          width: 100%;
          max-width: 420px;
          margin: 32px auto 24px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #f07a30, #e86820);
          color: #fff;
          border: none;
          border-radius: 50px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .bp-cta:hover:not(:disabled) {
          opacity: 0.9;
        }
        .bp-cta:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .bp-coming {
          display: inline-block;
          margin-left: 10px;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: rgba(255,255,255,0.25);
          vertical-align: middle;
        }

        /* History link */
        .bp-history-link {
          display: block;
          width: 100%;
          text-align: center;
          background: none;
          border: none;
          color: #3b6bdc;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          padding: 12px;
          margin-bottom: 20px;
        }
        .bp-history-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .bp-shell {
            padding: 20px 16px 48px;
          }
          .bp-toggles {
            flex-direction: column;
            gap: 8px;
          }
          .bp-reality-item {
            flex-direction: column;
            gap: 8px;
          }
          .bp-reality-item__val {
            align-self: flex-end;
          }
        }
      `}</style>
      <RegistrationRequiredModal
        open={isModalOpen}
        onClose={closeModal}
        message={modalMessage}
      />
    </>
  );
}
