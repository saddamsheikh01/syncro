"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useT, useAuth } from "@/hooks";
import { useBudget } from "../../../hooks/expats/useBudget";
import { useExpats } from "../../../hooks/expats/useExpats";
import { getCities } from "../../../services/expats";
import { expatsActions } from "../../../stores/expats/expatsStore";
import { BUDGET_FORM_STATE_STORAGE_KEY } from "../../../stores/expats/budgetStore";
import { readStorage, writeStorage } from "../../../stores/utils/storage";
import type { CityListItem } from "../../../types/expats";
import SimulationHistory from "./SimulationHistory";
import BudgetTracking from "./BudgetTracking";
import PlanTabs from "../shared/PlanTabs";
import { RegistrationRequiredModal } from "@/components/ui/RegistrationRequiredModal";
import { useRegistrationGate } from "../../../hooks/expats/useRegistrationGate";

type HousingType = "1br_center" | "3br_center";
type LivingType = "single" | "family";
type BudgetFormState = {
  budget: number;
  savings: number;
  housingType: HousingType;
  livingType: LivingType;
  cityId: string;
};

const DEFAULT_BUDGET_FORM_STATE: BudgetFormState = {
  budget: 2000,
  savings: 0,
  housingType: "1br_center",
  livingType: "single",
  cityId: "",
};

const isHousingType = (value: unknown): value is HousingType =>
  value === "1br_center" || value === "3br_center";

const isLivingType = (value: unknown): value is LivingType =>
  value === "single" || value === "family";

const readBudgetFormState = (): BudgetFormState => {
  const stored = readStorage<Partial<BudgetFormState> | null>(
    BUDGET_FORM_STATE_STORAGE_KEY,
    null
  );

  return {
    budget: typeof stored?.budget === "number" ? stored.budget : DEFAULT_BUDGET_FORM_STATE.budget,
    savings: typeof stored?.savings === "number" ? stored.savings : DEFAULT_BUDGET_FORM_STATE.savings,
    housingType: isHousingType(stored?.housingType)
      ? stored.housingType
      : DEFAULT_BUDGET_FORM_STATE.housingType,
    livingType: isLivingType(stored?.livingType)
      ? stored.livingType
      : DEFAULT_BUDGET_FORM_STATE.livingType,
    cityId: typeof stored?.cityId === "string" ? stored.cityId : DEFAULT_BUDGET_FORM_STATE.cityId,
  };
};

export default function BudgetPage() {
  const router = useRouter();
  const { t } = useT();
  const { isAuthenticated, status: authStatus } = useAuth();
  const { onboarding, loadOnboarding } = useExpats();
  const isAnonymous = !isAuthenticated;
  const {
    isLoading,
    activeSimulation,
    latestSimulation,
    simulations,
    trackingEntries,
    runSimulation,
    loadSimulations,
    loadTrackingEntries,
  } = useBudget();
  const [initialFormState] = useState<BudgetFormState>(() => readBudgetFormState());

  const [budget, setBudget] = useState(initialFormState.budget);
  const [savings, setSavings] = useState(initialFormState.savings);
  const [housingType, setHousingType] = useState<HousingType>(initialFormState.housingType);
  const [livingType, setLivingType] = useState<LivingType>(initialFormState.livingType);
  const [cityId, setCityId] = useState<string>(initialFormState.cityId);
  const [cities, setCities] = useState<CityListItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [anonymousSessionReady, setAnonymousSessionReady] = useState(false);
  const [initialDataReady, setInitialDataReady] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSimulationTriggeredRef = useRef(false);
  const { isModalOpen, modalMessage, openGate, closeModal } = useRegistrationGate();
  const [hasAnonymousSessionToken] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem("expats.session.token") !== null
  );

  const shouldRequireResolvedCity = isAuthenticated && !hasAnonymousSessionToken;
  const sessionReady = isAuthenticated
    ? authStatus !== "idle" && authStatus !== "loading"
    : anonymousSessionReady;
  const effectiveCityId =
    cityId || activeSimulation?.cityId || onboarding?.targetCityId || onboarding?.currentCityId || "";

  // Auto-init anonymous session if not authenticated
  useEffect(() => {
    if (authStatus === "idle" || authStatus === "loading") {
      return;
    }

    if (isAuthenticated) {
      return;
    }

    expatsActions.initSession()
      .then(() => setAnonymousSessionReady(true))
      .catch(() => setAnonymousSessionReady(true)); // proceed anyway — simulation may work without session
  }, [authStatus, isAuthenticated]);

  useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;

    const loadInitialData = async () => {
      await Promise.all([
        loadSimulations().catch(() => null),
        loadTrackingEntries().catch(() => null),
        getCities()
          .then((nextCities) => {
            if (!cancelled) {
              setCities(nextCities);
            }
          })
          .catch(() => null),
        shouldRequireResolvedCity ? loadOnboarding().catch(() => null) : Promise.resolve(null),
      ]);

      if (!cancelled) {
        setInitialDataReady(true);
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [sessionReady, loadSimulations, loadTrackingEntries, shouldRequireResolvedCity, loadOnboarding]);

  useEffect(() => {
    writeStorage(BUDGET_FORM_STATE_STORAGE_KEY, {
      budget,
      savings,
      housingType,
      livingType,
      cityId,
    });
  }, [budget, savings, housingType, livingType, cityId]);

  const triggerSimulation = useCallback((b: number, s: number, h: HousingType, l: LivingType, c: string) => {
    if (shouldRequireResolvedCity && !c) {
      return;
    }

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
  }, [runSimulation, shouldRequireResolvedCity]);

  useEffect(() => {
    if (!sessionReady || !initialDataReady || initialSimulationTriggeredRef.current) {
      return;
    }

    if (shouldRequireResolvedCity && !effectiveCityId) {
      initialSimulationTriggeredRef.current = true;
      return;
    }

    initialSimulationTriggeredRef.current = true;
    triggerSimulation(budget, savings, housingType, livingType, effectiveCityId);
  }, [
    budget,
    effectiveCityId,
    housingType,
    initialDataReady,
    livingType,
    savings,
    sessionReady,
    shouldRequireResolvedCity,
    triggerSimulation,
  ]);

  const handleBudgetChange = (val: number) => {
    setBudget(val);
    triggerSimulation(val, savings, housingType, livingType, effectiveCityId);
  };

  const handleSavingsChange = (val: number) => {
    setSavings(val);
    triggerSimulation(budget, val, housingType, livingType, effectiveCityId);
  };

  const handleHousingChange = (val: HousingType) => {
    setHousingType(val);
    triggerSimulation(budget, savings, val, livingType, effectiveCityId);
  };

  const handleLivingChange = (val: LivingType) => {
    setLivingType(val);
    triggerSimulation(budget, savings, housingType, val, effectiveCityId);
  };

  const handleCityChange = (val: string) => {
    setCityId(val);
    triggerSimulation(budget, savings, housingType, livingType, val);
  };

  const currentSimulation = activeSimulation ?? latestSimulation;
  const out = currentSimulation?.outputPayload ?? {};
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
              value={effectiveCityId}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value="">{isAnonymous ? t("Select a city") : t("Use profile city")}</option>
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

          {/* Reset button */}
          <button
            className="bp-reset"
            type="button"
            onClick={() => {
              // Force re-render by briefly setting to 0 then to defaults
              setBudget(0);
              setSavings(DEFAULT_BUDGET_FORM_STATE.savings);
              setHousingType(DEFAULT_BUDGET_FORM_STATE.housingType);
              setLivingType(DEFAULT_BUDGET_FORM_STATE.livingType);
              setCityId(DEFAULT_BUDGET_FORM_STATE.cityId);
              requestAnimationFrame(() => {
                setBudget(DEFAULT_BUDGET_FORM_STATE.budget);
                triggerSimulation(
                  DEFAULT_BUDGET_FORM_STATE.budget,
                  DEFAULT_BUDGET_FORM_STATE.savings,
                  DEFAULT_BUDGET_FORM_STATE.housingType,
                  DEFAULT_BUDGET_FORM_STATE.livingType,
                  DEFAULT_BUDGET_FORM_STATE.cityId
                );
              });
            }}
          >
            ↺ {t("Reset")}
          </button>

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
          <div className="bp-card" data-testid="budget-entry-cost-card">
            <h2 className="bp-card__title">{t("Entry Cost")}</h2>
            <div className="bp-entry-list">
              <div className="bp-entry-item" data-testid="budget-entry-first-month">
                <span>🏠 {t("First Month Rent")}</span>
                <span className="bp-entry-val">€{(entryCost.firstMonthRent ?? rent).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bp-entry-item" data-testid="budget-entry-deposit">
                <span>💰 {t("Deposit")} (2 {t("months")})</span>
                <span className="bp-entry-val">€{(entryCost.deposit ?? rent * 2).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bp-entry-item" data-testid="budget-entry-basic-setup">
                <span>🎆 {t("Basic Setup")} ({t("Furniture / SIM Etc.")})</span>
                <span className="bp-entry-val">€{(entryCost.basicSetup ?? 500).toLocaleString("de-DE", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="bp-entry-item bp-entry-item--total" data-testid="budget-entry-total">
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

        {/* ── Upsell Banner (anonymous only) ───────────────── */}
        {isAnonymous && currentSimulation && (
          <div className="bp-upsell">
            <div className="bp-upsell__content">
              <h3 className="bp-upsell__title">📊 {t("Want more from your simulation?")}</h3>
              <div className="bp-upsell__features">
                <div className="bp-upsell__feature">💾 {t("Save and compare simulation history")}</div>
                <div className="bp-upsell__feature">📈 {t("Track real expenses vs budget monthly")}</div>
                <div className="bp-upsell__feature">⚡ {t("Unlock Stability Score & AI insights (Premium)")}</div>
                <div className="bp-upsell__feature">🔮 {t("6-month financial projections (Super Pro)")}</div>
              </div>
              <button className="bp-upsell__cta" type="button" onClick={() => openGate("generic")}>
                {t("Create Free Account")} →
              </button>
            </div>
          </div>
        )}

        {/* ── Premium Preview (anonymous only) ─────────────── */}
        {isAnonymous && currentSimulation && (
          <div className="bp-preview">
            <div className="bp-preview__header">
              <h3 className="bp-preview__title">🔒 {t("Premium Analysis Preview")}</h3>
              <span className="bp-preview__badge">{t("Premium")}</span>
            </div>
            <div className="bp-preview__blur">
              <div className="bp-preview__item">
                <span>{t("Stability Score")}</span>
                <span className="bp-preview__val">●●/100</span>
              </div>
              <div className="bp-preview__item">
                <span>{t("Stress Index")}</span>
                <span className="bp-preview__val">0.●●</span>
              </div>
              <div className="bp-preview__item">
                <span>{t("AI Insight")}</span>
                <span className="bp-preview__val">{t("Your financial situation is...")}</span>
              </div>
            </div>
            <button className="bp-preview__cta" type="button" onClick={() => openGate("premium_plan")}>
              🔓 {t("Unlock Premium Analysis")}
            </button>
          </div>
        )}

        {/* ── CTA to Starter Kit ─────────────────────────────── */}
        <button className="bp-cta" type="button" onClick={() => {
          if (isAnonymous) { openGate("starter_kit"); }
          else { router.push("/expats/starter-kit"); }
        }}>
          🎯 {t("Get Your Personalized Starter Kit")}
        </button>

        {/* ── History toggle (registered only) ─────────────── */}
        {!isAnonymous && (
          <>
            <button
              className="bp-history-link"
              onClick={() => setShowHistory(!showHistory)}
              type="button"
            >
              {showHistory ? t("Hide Simulation History") : t("View Simulation History")} ({simulations.length})
            </button>
            {showHistory && <SimulationHistory simulations={simulations} />}
          </>
        )}

        {/* ── Tracking toggle (registered only) ──────────────── */}
        {!isAnonymous && (
          <>
            <button
              className="bp-history-link"
              onClick={() => setShowTracking(!showTracking)}
              type="button"
            >
              {showTracking ? t("Hide Expense Tracking") : t("Track Your Real Expenses")} ({trackingEntries.length})
            </button>
            {showTracking && <BudgetTracking entries={trackingEntries} simulations={simulations} />}
          </>
        )}
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

        .bp-reset {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 8px 0 0 auto;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #e4e9f2;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #6c778a;
          cursor: pointer;
          transition: all 0.2s;
        }
        .bp-reset:hover {
          border-color: #3b6bdc;
          color: #3b6bdc;
        }
        .bp-upsell {
          background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
          border: 2px solid #3b6bdc;
          border-radius: 16px;
          padding: 24px;
          margin-top: 24px;
        }
        .bp-upsell__title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0 0 16px;
        }
        .bp-upsell__features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
        }
        .bp-upsell__feature {
          font-size: 0.875rem;
          color: #475569;
        }
        .bp-upsell__cta {
          display: inline-block;
          padding: 12px 32px;
          background: #3b6bdc;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .bp-upsell__cta:hover {
          background: #2d5bc4;
        }
        .bp-preview {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 24px;
          margin-top: 16px;
          position: relative;
          overflow: hidden;
        }
        .bp-preview__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .bp-preview__title {
          font-size: 1rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0;
        }
        .bp-preview__badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: linear-gradient(135deg, #7c3aed, #3b6bdc);
          color: #fff;
          padding: 4px 12px;
          border-radius: 20px;
        }
        .bp-preview__blur {
          filter: blur(4px);
          pointer-events: none;
          user-select: none;
          opacity: 0.5;
        }
        .bp-preview__item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f3f8;
          font-size: 0.875rem;
          color: #475569;
        }
        .bp-preview__val {
          font-weight: 600;
          color: #0d1b36;
        }
        .bp-preview__cta {
          display: block;
          width: 100%;
          margin-top: 16px;
          padding: 12px;
          background: linear-gradient(135deg, #7c3aed, #3b6bdc);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .bp-preview__cta:hover {
          opacity: 0.9;
        }
        @media (max-width: 640px) {
          .bp-shell {
            padding: 20px 16px 48px;
          }
          .bp-toggles {
            flex-direction: column;
            gap: 8px;
          }
          .bp-upsell__features {
            grid-template-columns: 1fr;
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
