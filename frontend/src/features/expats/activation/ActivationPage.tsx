"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/hooks";
import { useExpats } from "../../../hooks/expats/useExpats";
import { useBudget } from "../../../hooks/expats/useBudget";
import { useStarterKit } from "../../../hooks/expats/useStarterKit";
// useMicroTest is consumed by MicroTestCard internally
import { useRisk } from "../../../hooks/expats/useRisk";
import RadarChart from "../wow/RadarChart";
import MicroTestCard from "../microtest/MicroTestCard";
import type {
  BudgetSimulationResponse,
  CityScoreResponse,
  OnboardingResponse,
} from "../../../types/expats";

const RADAR_FALLBACK_VALUES = [48, 72, 73, 52, 89, 87];
const RADAR_MACROAREA_KEYS = [
  "costo_vita",
  "potere_economico",
  "qualita_vita",
  "mercato_immobiliare",
  "integrazione_sociale",
  "opportunita_lavorative",
];
const RADAR_LABEL_KEYS = [
  "Expats.wow.costOfLivingLabel",
  "Expats.wow.economicPower",
  "Expats.wow.qualityOfLife",
  "Expats.wow.housingMarket",
  "Expats.wow.socialIntegration",
  "Expats.wow.workOpportunities",
];

/** Build radar data with translated labels. Uses real scoring values if available. */
function buildRadarData(t: (k: string) => string, breakdown?: Record<string, number> | null) {
  return RADAR_LABEL_KEYS.map((key, i) => {
    const label = t(key);
    const macroareaKey = RADAR_MACROAREA_KEYS[i];
    const value = breakdown?.[macroareaKey] ?? RADAR_FALLBACK_VALUES[i];
    return {
      label,
      shortLabel: label
        .replace(/ Of /g, "\nOf ")
        .replace(/ /g, "\n")
        .slice(0, 15),
      value: Math.round(value),
    };
  });
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function resolveContextSimulation(
  activeSimulation: BudgetSimulationResponse | null,
  latestSimulation: BudgetSimulationResponse | null,
  onboarding: OnboardingResponse | null
): BudgetSimulationResponse | null {
  const preferredCityId = onboarding?.targetCityId ?? onboarding?.currentCityId ?? null;
  const candidates = [activeSimulation, latestSimulation].filter(
    (simulation): simulation is BudgetSimulationResponse => !!simulation
  );

  if (preferredCityId) {
    const matching = candidates.find((simulation) => simulation.cityId === preferredCityId);
    if (matching) {
      return matching;
    }
  }

  return candidates[0] ?? null;
}

const STRATEGY_MONTH_KEYS = [
  {
    icon: "📋",
    titleKey: "Expats.activation.month1.title",
    bodyKey: "Expats.activation.month1.body",
  },
  {
    icon: "🏗️",
    titleKey: "Expats.activation.month2.title",
    bodyKey: "Expats.activation.month2.body",
  },
  {
    icon: "🌐",
    titleKey: "Expats.activation.month3.title",
    bodyKey: "Expats.activation.month3.body",
  },
];

const PROFESSIONAL_KEYS = [
  { icon: "🏠", labelKey: "Expats.activation.professionals.realEstate" },
  { icon: "⚖️", labelKey: "Expats.activation.professionals.lawyer" },
  { icon: "📊", labelKey: "Expats.activation.professionals.accountant" },
  { icon: "🏋️", labelKey: "Expats.activation.professionals.trainer" },
  { icon: "🗣️", labelKey: "Expats.activation.professionals.language" },
  { icon: "🧳", labelKey: "Expats.activation.professionals.relocation" },
];

const STARTER_KIT_KEYS = [
  "Expats.activation.starterKit1",
  "Expats.activation.starterKit2",
  "Expats.activation.starterKit3",
  "Expats.activation.starterKit4",
];

const EVENTS_KEYS = [
  "Expats.activation.events1",
  "Expats.activation.events2",
  "Expats.activation.events3",
];

// ─── Variant: Planning Move ───────────────────────────────────────────────────

function ActivationPlanningMove({
  cityName = "Lisbon",
  budget = 2500,
  estimatedCost = 2075,
}: {
  cityName?: string;
  budget?: number;
  estimatedCost?: number;
}) {
  const router = useRouter();
  const { t } = useT();
  const margin = budget - estimatedCost;
  const titleLines = t("Expats.activation.planning.title", {
    city: cityName,
  }).split("\n");
  const subLines = t("Expats.activation.planning.sub", {
    city: cityName,
  }).split("\n");
  return (
    <div className="activation-main">
      {/* Top banner */}
      <div className="activation-banner">
        <div className="activation-logo">
          <span className="activation-logo__icon">∞</span>
          <span className="activation-logo__text">
            {t("Expats.activation.banner")}
          </span>
        </div>
      </div>
      <div className="activation-header">
        <h1 className="activation-title">
          {titleLines[0]}
          <br />
          {titleLines[1]}
        </h1>
        <p className="activation-subtitle">
          {subLines[0]}
          <br />
          {subLines[1]}
        </p>
      </div>

      <div className="activation-grid">
        {/* Left column */}
        <div className="act-col">
          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "4rem" }}>📓</span>
            </div>
            <h3 className="act-card__title">📅 {t("Your First 3 Months Strategy")}</h3>
            {STRATEGY_MONTH_KEYS.map((m) => (
              <div key={m.titleKey} className="act-month">
                <p className="act-month__title">
                  <span>{m.icon}</span> <strong>{t(m.titleKey)}</strong>
                </p>
                <p className="act-month__body">{t(m.bodyKey)}</p>
              </div>
            ))}
          </div>
          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "4rem" }}>💬</span>
            </div>
            <p className="act-card__badge act-card__badge--free">
              🆓 {t("Free – Community Lounge")}
            </p>
            <p className="act-badge-desc">
              {t("Read Discussions. Ask Questions. Join Local Events.")}
            </p>
            <p className="act-card__badge act-card__badge--premium">
              🌟 {t("Premium – Target Lounge")}
            </p>
            <p className="act-badge-desc">
              {t("Get Matched With Curated Groups Based On Your Budget, Relocation Stage And Lifestyle.")}
            </p>
          </div>
          <div className="act-card act-card--warning">
            <div className="act-card__img-area">
              <span style={{ fontSize: "3.5rem" }}>⚠️</span>
            </div>
            <h3 className="act-card__title">⚠️ {t("Hidden Risk")}</h3>
          </div>
        </div>

        {/* Center column */}
        <div className="act-col">
          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "4rem" }}>🛡️</span>
            </div>
            <h3 className="act-card__title">
              🛡️ Verified Professionals Network
            </h3>
            <p className="act-card__subtitle">
              {t("Real Local Support, Not A Marketplace.")}
            </p>
            {PROFESSIONAL_KEYS.map((p) => (
              <p key={p.labelKey} className="act-pro-item">
                {p.icon} {t(p.labelKey)}
              </p>
            ))}
          </div>

          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "4rem" }}>🧳</span>
            </div>
            <h3 className="act-card__title">📦 {t("EXPAT STARTER KIT:")}</h3>
            <p className="act-card__subtitle">
              {t("Your Relocation Profile Analysis.")}
            </p>
            {STARTER_KIT_KEYS.map((key) => (
              <p key={key} className="act-check-item">
                ✓ {t(key)}
              </p>
            ))}
            <p className="act-kit-footer">
              Understand How To Approach Your Move Correctly.
            </p>
          </div>

          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "4rem" }}>🎉</span>
            </div>
            <h3 className="act-card__title">📺 {t("EVENTS")}</h3>
            <p className="act-card__subtitle">
              {t("Learn, Connect And Meet People In The Community.")}
            </p>
            {EVENTS_KEYS.map((key) => (
              <p key={key} className="act-check-item">
                ✓ {t(key)}
              </p>
            ))}
          </div>

          <button
            onClick={() => router.push("/expats/subscriptions")}
            className="act-cta-btn"
          >
            {t("Start My {city} Plan").replace("{city}", cityName)}
          </button>
        </div>

        {/* Right column */}
        <div className="act-col">
          <div className="act-card">
            <div className="act-mentor-preview">
              <div className="act-mentor-dot" />
              <span className="act-mentor-label">{t("MENTOR PREVIEW")}</span>
            </div>
            <div className="act-mentor-row">
              <div className="act-mentor-avatar">👨</div>
              <div>
                <p className="act-mentor-name">Marco</p>
                <p className="act-mentor-route">Milan → {cityName}</p>
                <p className="act-mentor-route">In 4 Months</p>
              </div>
            </div>
            <p className="act-mentor-insight">
              <strong>
                {t("People Who Relocated With This Structure Avoided Up To €6,000 In Early Mistakes.")}
              </strong>
            </p>
            <div className="act-mentor-tiers">
              <p>📱 Free: 15-Min Preview</p>
              <p>⭐ Premium: 30 Min / Month + Target Lounge Access</p>
            </div>
          </div>

          <div className="act-card" data-testid="activation-budget-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "3rem" }}>📊</span>
            </div>
            <h3 className="act-card__title">📊 {t("SIMULATOR BUDGET")}</h3>
            <p className="act-budget-row" data-testid="activation-estimated-cost">
              🏠 {t("Estimated Monthly Cost")} — €{estimatedCost.toLocaleString()}
            </p>
            <p className="act-budget-row" data-testid="activation-declared-budget">
              💳 {t("Your Declared Budget")} — €{budget.toLocaleString()}
            </p>
            <p className="act-budget-row" data-testid="activation-remaining-margin">📉 {t("Remaining Margin")} — €{margin}</p>
            <p
              data-testid="activation-budget-status"
              className={`act-budget-result ${margin > 0 ? "act-budget-result--ok" : "act-budget-result--risk"}`}
            >
              {margin > 0
                ? `● ${t("Financially Sustainable")}`
                : `● ${t("Budget Tight")}`}
            </p>
          </div>

          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "3rem" }}>🔀</span>
            </div>
            <h3 className="act-card__title">🔄 {t("PLATFORM SUPPORT")}</h3>
            <p className="act-card__subtitle">
              {t("Sometimes You Just Need Clarity.")}
            </p>
            <p className="act-check-item">✓ Get Answers To Your Questions</p>
            <p className="act-check-item">✓ Understand The Next Step</p>
            <p className="act-check-item">
              ✓ Find The Right People And Resources
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variant: Unsure (City Ranking) ──────────────────────────────────────────

function ActivationUnsure({ topCity = "Valencia" }: { topCity?: string }) {
  const router = useRouter();
  const { t } = useT();
  return (
    <div className="activation-main">
      <div className="activation-banner">
        <div className="activation-logo">
          <span className="activation-logo__icon">∞</span>
          <span className="activation-logo__text">
            {t("Expats.activation.banner")}
          </span>
        </div>
      </div>
      <div className="activation-header">
        <h1 className="activation-title">
          {topCity} Looks Like Your Strongest Match
          <br />
          But 3 Decisions Will Determine If The Move Works
        </h1>
        <p className="activation-subtitle">
          Based On Your Profile, {topCity} Currently Fits Many Of Your
          Priorities.
          <br />
          Housing Timing, Budget Margin And Local Network Will Shape Your
          Success.
        </p>
      </div>
      <div className="activation-grid">
        <div className="act-col">
          <div className="act-card">
            <h3 className="act-card__title">📅 {t("Your First 3 Months Strategy")}</h3>
            {STRATEGY_MONTH_KEYS.map((m) => (
              <div key={m.titleKey} className="act-month">
                <p className="act-month__title">
                  <strong>{t(m.titleKey)}</strong>
                </p>
                <p className="act-month__body">{t(m.bodyKey)}</p>
              </div>
            ))}
          </div>
          <div className="act-card">
            <span
              style={{
                fontSize: "3rem",
                display: "block",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              💬
            </span>
            <p className="act-card__badge act-card__badge--free">
              🆓 {t("Free – Community Lounge")}
            </p>
            <p className="act-badge-desc">
              {t("Read Discussions. Ask Questions. Join Local Events.")}
            </p>
            <p className="act-card__badge act-card__badge--premium">
              🌟 {t("Premium – Target Lounge")}
            </p>
            <p className="act-badge-desc">
              {t("Get Matched With Curated Groups Based On Your Budget, Relocation Stage And Lifestyle.")}
            </p>
          </div>
          <div className="act-card act-card--warning">
            <div className="act-card__img-area">
              <span style={{ fontSize: "3.5rem" }}>⚠️</span>
            </div>
            <h3 className="act-card__title">⚠️ {t("Hidden Risk")}</h3>
            <p className="act-card__subtitle">{t("Find The Right Housing")}</p>
            <p className="act-month__body">
              {t("Rent Prices May Rise Quickly. Syncro Suggests Budget-Compatible Neighborhoods And Safer Options.")}
            </p>
          </div>
        </div>

        <div className="act-col">
          <div className="act-card">
            <span
              style={{
                fontSize: "3rem",
                display: "block",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              🛡️
            </span>
            <h3 className="act-card__title">
              🛡️ Verified Professionals Network
            </h3>
            <p className="act-card__subtitle">
              {t("Real Local Support, Not A Marketplace.")}
            </p>
            {PROFESSIONAL_KEYS.map((p) => (
              <p key={p.labelKey} className="act-pro-item">
                {p.icon} {t(p.labelKey)}
              </p>
            ))}
          </div>
          <div className="act-card">
            <h3 className="act-card__title">📦 {t("EXPAT STARTER KIT:")}</h3>
            <p className="act-card__subtitle">
              {t("Your Relocation Profile Analysis.")}
            </p>
            {STARTER_KIT_KEYS.map((key) => (
              <p key={key} className="act-check-item">
                ✓ {t(key)}
              </p>
            ))}
            <p className="act-kit-footer">
              Understand How To Approach Your Move Correctly.
            </p>
          </div>
          <div className="act-card">
            <h3 className="act-card__title">📺 {t("EVENTS")}</h3>
            {EVENTS_KEYS.map((key) => (
              <p key={key} className="act-check-item">
                ✓ {t(key)}
              </p>
            ))}
          </div>
          <button
            onClick={() => router.push("/expats/subscriptions")}
            className="act-cta-btn"
          >
            {t("Start My {city} Plan").replace("{city}", topCity)}
          </button>
        </div>

        <div className="act-col">
          <div className="act-card">
            <div className="act-mentor-preview">
              <div className="act-mentor-dot" />
              <span className="act-mentor-label">{t("MENTOR PREVIEW")}</span>
            </div>
            <div className="act-mentor-row">
              <div className="act-mentor-avatar">👨</div>
              <div>
                <p className="act-mentor-name">Marco</p>
                <p className="act-mentor-route">Milan → Lisbon · In 4 Months</p>
              </div>
            </div>
            <p className="act-mentor-insight">
              <strong>
                {t("People Who Relocated With This Structure Avoided Up To €6,000 In Early Mistakes.")}
              </strong>
            </p>
            <div className="act-mentor-tiers">
              <p>📱 Free: 15-Min Preview</p>
              <p>⭐ Premium: 30 Min / Month + Target Lounge Access</p>
            </div>
          </div>
          <div className="act-card">
            <h3 className="act-card__title">📊 {t("SIMULATOR BUDGET")}</h3>
            <p className="act-budget-row">🏠 {t("Estimated Monthly Cost")} — €2,075</p>
            <p className="act-budget-row">💳 {t("Your Declared Budget")} — €2,500</p>
            <p className="act-budget-row">📉 {t("Remaining Margin")} — €425</p>
            <p className="act-budget-result act-budget-result--ok">
              ● Result: {t("Financially Sustainable")}
            </p>
          </div>
          <div className="act-card">
            <h3 className="act-card__title">🔄 {t("PLATFORM SUPPORT")}</h3>
            <p className="act-check-item">✓ Get Answers To Your Questions</p>
            <p className="act-check-item">✓ Understand The Next Step</p>
            <p className="act-check-item">
              ✓ Find The Right People And Resources
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variant: Already There ───────────────────────────────────────────────────

function ActivationAlreadyThere({
  cityName = "Lisbon",
  radarBreakdown,
}: {
  cityName?: string;
  radarBreakdown?: Record<string, number> | null;
}) {
  const router = useRouter();
  const { t } = useT();
  return (
    <div className="activation-main">
      <div className="activation-banner">
        <div className="activation-logo">
          <span className="activation-logo__icon">∞</span>
          <span className="activation-logo__text">
            {t("Expats.activation.banner")}
          </span>
        </div>
      </div>
      <div className="activation-header">
        <h1 className="activation-title">
          You&apos;re In {cityName}. Now Let&apos;s Make It Work Fully For You.
        </h1>
        <p className="activation-subtitle">
          Based On Your Profile, There Are Several Areas Where {cityName} Could
          Work Better For Your Lifestyle.
          <br />
          Here&apos;s Your Personalized Action Plan.
        </p>
      </div>
      <div className="activation-grid">
        <div className="act-col">
          <div className="act-card">
            <div className="act-card--radar">
              <RadarChart data={buildRadarData(t, radarBreakdown)} size={200} />
            </div>
            <h3 className="act-card__title" style={{ marginTop: 12 }}>
              Your {cityName} Alignment Score
            </h3>
            <p className="act-month__body">
              Six layers define your positioning inside the city. Right now,
              some aspects are not in sync.
            </p>
          </div>
          <div className="act-card">
            <span
              style={{
                fontSize: "3rem",
                display: "block",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              💬
            </span>
            <p className="act-card__badge act-card__badge--free">
              🆓 {t("Free – Community Lounge")}
            </p>
            <p className="act-badge-desc">Connect with locals in your city.</p>
            <p className="act-card__badge act-card__badge--premium">
              🌟 {t("Premium – Target Lounge")}
            </p>
            <p className="act-badge-desc">
              Curated groups based on your relocation phase.
            </p>
          </div>
        </div>
        <div className="act-col">
          <div className="act-card">
            <h3 className="act-card__title">
              📅 Your 90-Day Integration Boost
            </h3>
            {STRATEGY_MONTH_KEYS.map((m) => (
              <div key={m.titleKey} className="act-month">
                <p className="act-month__title">
                  <strong>{t(m.titleKey)}</strong>
                </p>
                <p className="act-month__body">{t(m.bodyKey)}</p>
              </div>
            ))}
          </div>
          <div className="act-card">
            <h3 className="act-card__title">📦 {t("EXPAT STARTER KIT:")}</h3>
            {STARTER_KIT_KEYS.map((key) => (
              <p key={key} className="act-check-item">
                ✓ {t(key)}
              </p>
            ))}
          </div>
          <button
            onClick={() => router.push("/expats/subscriptions")}
            className="act-cta-btn"
          >
            Unlock My Full {cityName} Plan
          </button>
        </div>
        <div className="act-col">
          <div className="act-card">
            <div className="act-mentor-preview">
              <div className="act-mentor-dot" />
              <span className="act-mentor-label">{t("MENTOR PREVIEW")}</span>
            </div>
            <div className="act-mentor-row">
              <div className="act-mentor-avatar">👨</div>
              <div>
                <p className="act-mentor-name">Marco</p>
                <p className="act-mentor-route">
                  Living in {cityName} · 2 Years
                </p>
              </div>
            </div>
            <p className="act-mentor-insight">
              <strong>
                Get insider advice from someone who already navigated this.
              </strong>
            </p>
          </div>
          <div className="act-card">
            <h3 className="act-card__title">📊 BUDGET CHECK</h3>
            <p className="act-budget-row">🏠 {t("Estimated Monthly Cost")} — €2,075</p>
            <p className="act-budget-row">💳 {t("Your Declared Budget")} — €2,500</p>
            <p className="act-budget-result act-budget-result--ok">
              ● {t("Financially Sustainable")}
            </p>
          </div>
          <div className="act-card">
            <h3 className="act-card__title">🔄 {t("PLATFORM SUPPORT")}</h3>
            {[
              t("Get Answers To Your Questions"),
              t("Understand The Next Step"),
              t("Find The Right People And Resources"),
            ].map((i) => (
              <p key={i} className="act-check-item">
                ✓ {i}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variant: City Comparison ────────────────────────────────────────────────

function ActivationComparison({
  currentCity = "Milan",
  targetCity = "Valencia",
  budget = 2500,
  estimatedCost = 2075,
  macroComparison,
}: {
  currentCity?: string;
  targetCity?: string;
  budget?: number;
  estimatedCost?: number;
  macroComparison?: { label: string; currentScore: number; targetScore: number; direction: string }[];
}) {
  const router = useRouter();
  const { t } = useT();
  const margin = budget - estimatedCost;
  const MACRO_COMPARISON = macroComparison ?? [
    { label: t("Cost Of Living"), currentScore: 25, targetScore: 60, direction: "improvement" },
    { label: t("Housing Market"), currentScore: 40, targetScore: 55, direction: "improvement" },
    { label: t("Economic Power"), currentScore: 65, targetScore: 58, direction: "decline" },
    { label: t("Quality Of Life"), currentScore: 70, targetScore: 82, direction: "improvement" },
    { label: t("Work Opportunities"), currentScore: 75, targetScore: 70, direction: "decline" },
    { label: t("Social Integration"), currentScore: 55, targetScore: 78, direction: "improvement" },
  ];
  return (
    <div className="activation-main">
      <div className="activation-banner">
        <div className="act-lang-pill">🇮🇹 ▾</div>
        <div className="activation-logo">
          <span className="activation-logo__icon">∞</span>
          <span className="activation-logo__text">
            {t("Expats.activation.banner")}
          </span>
        </div>
      </div>
      <div className="activation-header">
        <h1 className="activation-title">
          {t("See How Your Life Could Change In {city}").replace("{city}", targetCity)}
        </h1>
        <p className="activation-subtitle">
          {t("Based On Your Profile, Syncro Compares {currentCity} And {targetCity} To Show How Your Cost Of Living, Lifestyle, Social Integration And Opportunities Could Evolve.").replace("{currentCity}", currentCity).replace("{targetCity}", targetCity)}
        </p>
      </div>
      <div className="activation-grid">
        <div className="act-col">
          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "3.5rem" }}>📓</span>
            </div>
            <h3 className="act-card__title">📅 {t("Your First 3 Months Strategy")}</h3>
            {STRATEGY_MONTH_KEYS.map((m) => (
              <div key={m.titleKey} className="act-month">
                <p className="act-month__title">
                  <span>{m.icon}</span> <strong>{t(m.titleKey)}</strong>
                </p>
                <p className="act-month__body">{t(m.bodyKey)}</p>
              </div>
            ))}
          </div>
          <div className="act-card">
            <span
              style={{
                fontSize: "3rem",
                display: "block",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              💬
            </span>
            <p className="act-card__badge act-card__badge--free">
              🆓 {t("Free – Community Lounge")}
            </p>
            <p className="act-badge-desc">
              {t("Read Discussions. Ask Questions. Join Local Events.")}
            </p>
            <p className="act-card__badge act-card__badge--premium">
              🌟 {t("Premium – Target Lounge")}
            </p>
            <p className="act-badge-desc">
              {t("Get Matched With Curated Groups Based On Your Budget, Relocation Stage And Lifestyle.")}
            </p>
          </div>
          <div className="act-card act-card--warning">
            <h3 className="act-card__title" style={{ color: "#d4900a" }}>
              ⚠ {t("Hidden Risk")}
            </h3>
            {[
              {
                label: t("Find The Right Housing"),
                body: t("Rent Prices May Rise Quickly. Syncro Suggests Budget-Compatible Neighborhoods And Safer Options."),
              },
            ].map((r) => (
              <div key={r.label} className="act-month">
                <p className="act-month__title">
                  <strong>{r.label}</strong>
                </p>
                <p className="act-month__body">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="act-col">
          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "3rem" }}>👥</span>
            </div>
            <h3 className="act-card__title">
              🏅 Verified Professionals Network
            </h3>
            <p className="act-card__subtitle">
              {t("Real Local Support, Not A Marketplace.")}
            </p>
            {PROFESSIONAL_KEYS.map((p) => (
              <p key={p.labelKey} className="act-pro-item">
                {p.icon} {t(p.labelKey)}
              </p>
            ))}
          </div>
          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "3rem" }}>🌍</span>
            </div>
            <h3 className="act-card__title">📦 {t("EXPAT STARTER KIT:")}</h3>
            <p className="act-card__subtitle">
              {t("Your Relocation Profile Analysis.")}
            </p>
            {STARTER_KIT_KEYS.map((key) => (
              <p key={key} className="act-check-item">
                ✓ {t(key)}
              </p>
            ))}
            <p className="act-kit-footer">
              Understand How To Approach Your Move Correctly.
            </p>
          </div>
          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "3rem" }}>🎓</span>
            </div>
            <h3 className="act-card__title">🎯 EVENTS</h3>
            <p className="act-card__subtitle">
              {t("Learn, Connect And Meet People In The Community.")}
            </p>
            {EVENTS_KEYS.map((key) => (
              <p key={key} className="act-check-item">
                ✓ {t(key)}
              </p>
            ))}
          </div>
          <button
            onClick={() => router.push("/expats/subscriptions")}
            className="act-cta-btn"
          >
            {t("Start My {city} Plan").replace("{city}", targetCity)}
          </button>
        </div>
        <div className="act-col">
          <div className="act-card">
            <div className="act-mentor-preview">
              <div className="act-mentor-dot" />
              <span className="act-mentor-label">{t("MENTOR PREVIEW")}</span>
            </div>
            <div className="act-mentor-row">
              <div className="act-mentor-avatar">👨</div>
              <div>
                <p className="act-mentor-name">Marco</p>
                <p className="act-mentor-route">
                  {currentCity} → {targetCity} · In 4 Months
                </p>
              </div>
            </div>
            <p className="act-mentor-insight">
              <strong>
                {t("People Who Relocated With This Structure Avoided Up To €6,000 In Early Mistakes.")}
              </strong>
            </p>
            <div className="act-mentor-tiers">
              <p>🆓 Free: 15-Min Preview</p>
              <p>🌟 Premium: 30 Min / Month + Target Lounge Access</p>
            </div>
          </div>
          <div className="act-card" data-testid="activation-budget-card">
            <h3 className="act-card__title">📊 {t("SIMULATOR BUDGET")}</h3>
            {MACRO_COMPARISON.map((m) => (
              <div key={m.label} className="act-comparison-row">
                <span className="act-comparison-label">{m.label}</span>
                <div className="act-comparison-bars">
                  <div
                    className="act-bar act-bar--current"
                    style={{ width: `${m.currentScore}%` }}
                    title={`${currentCity}: ${m.currentScore}`}
                  />
                  <div
                    className={`act-bar ${m.direction === "improvement" ? "act-bar--target-good" : "act-bar--target-bad"}`}
                    style={{ width: `${m.targetScore}%` }}
                    title={`${targetCity}: ${m.targetScore}`}
                  />
                </div>
                <span
                  className={`act-comparison-delta ${m.direction === "improvement" ? "act-delta--up" : "act-delta--down"}`}
                >
                  {m.direction === "improvement" ? "↑" : "↓"}{" "}
                  {Math.abs(m.targetScore - m.currentScore)}
                </span>
              </div>
            ))}
            <div className="act-budget-divider" />
            <p className="act-budget-row" data-testid="activation-estimated-cost">
              🏠 {t("Estimated Monthly Cost")} — €{estimatedCost.toLocaleString()}
            </p>
            <p className="act-budget-row" data-testid="activation-declared-budget">
              💳 {t("Your Declared Budget")} — €{budget.toLocaleString()}
            </p>
            <p className="act-budget-row" data-testid="activation-remaining-margin">
              📈 {t("Remaining Margin")} — €{margin.toLocaleString()}
            </p>
            <p
              data-testid="activation-budget-status"
              className={`act-budget-result ${margin >= 0 ? "act-budget-result--ok" : "act-budget-result--risk"}`}
            >
              {margin >= 0 ? `● ${t("Financially Sustainable")}` : `● ${t("Budget At Risk")}`}
            </p>
          </div>
          <div className="act-card">
            <div className="act-card__img-area">
              <span style={{ fontSize: "3rem" }}>🚦</span>
            </div>
            <h3 className="act-card__title">🔄 {t("PLATFORM SUPPORT")}</h3>
            <p className="act-card__subtitle">
              {t("Sometimes You Just Need Clarity.")}
            </p>
            {[
              t("Get Answers To Your Questions"),
              t("Understand The Next Step"),
              t("Find The Right People And Resources"),
            ].map((i) => (
              <p key={i} className="act-check-item">
                ✓ {i}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NextActions Progress Banner ─────────────────────────────────────────────

function NextActionsBanner({
  action,
  description,
  onAction,
  isLoading,
}: {
  action: string;
  description: string;
  onAction: () => void;
  isLoading: boolean;
}) {
  const { t } = useT();
  const LABELS: Record<string, string> = {
    complete_onboarding: t("Complete Your Profile"),
    create_snapshot: t("Create Your Profile Snapshot"),
    compute_scoring: t("Compute Your City Scores"),
    view_results: t("View Your City Results"),
  };
  return (
    <div className="act-next-banner">
      <div className="act-next-banner__left">
        <span className="act-next-banner__icon">
          {action === "complete_onboarding"
            ? "📋"
            : action === "create_snapshot"
              ? "📸"
              : action === "compute_scoring"
                ? "🧮"
                : "📊"}
        </span>
        <div>
          <p className="act-next-banner__title">{LABELS[action] ?? action}</p>
          <p className="act-next-banner__desc">{description}</p>
        </div>
      </div>
      <button
        className="act-next-banner__btn"
        onClick={onAction}
        disabled={isLoading}
      >
        {isLoading ? t("Processing…") : (LABELS[action] ?? t("Continue"))}
      </button>
    </div>
  );
}

// ─── Real Scoring Card ────────────────────────────────────────────────────────

function RealScoringCard({ scores }: { scores: CityScoreResponse[] }) {
  const { t } = useT();
  if (!scores.length) return null;
  const top = scores[0];
  const radarData = Object.entries(top.radarValues ?? {}).map(
    ([key, value]) => ({
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      shortLabel: key
        .replace(/_/g, "\n")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      value: value as number,
    }),
  );
  return (
    <div className="act-card act-card--scoring">
      <h3 className="act-card__title">🏆 {t("Your Top City:")} {top.cityName}</h3>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <span className="act-score-big">{top.scoreTotal}</span>
        <span className="act-score-label"> / 100</span>
        <span
          className="act-compat-badge"
          style={{
            background:
              top.compatibilityLevel === "VERY_STRONG_FIT"
                ? "#3b6bdc"
                : top.compatibilityLevel === "GOOD_FIT"
                  ? "#22a55f"
                  : "#f2b203",
          }}
        >
          {t(top.compatibilityLevel ?? "")}
        </span>
      </div>
      {radarData.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <RadarChart data={radarData} size={180} />
        </div>
      )}
      {top.insights && (
        <div className="act-insights">
          {top.insights.strengths?.map((s: string) => (
            <p key={s} className="act-check-item">
              ✓ {s}
            </p>
          ))}
          {top.insights.warnings?.map((w: string) => (
            <p key={w} className="act-warning-item">
              ⚠ {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Activation Page ─────────────────────────────────────────────────────

// ─── Sprint 2 Dashboard ─────────────────────────────────────────────────────

function Sprint2Dashboard() {
  const router = useRouter();
  const { t } = useT();
  const {
    activeSimulation,
    latestSimulation,
    trackingEntries,
    loadSimulations,
    loadTrackingEntries,
  } = useBudget();
  const { starterKit, loadLatestKit } = useStarterKit();
  const { riskSnapshot, loadRiskIndicators } = useRisk();

  useEffect(() => {
    loadSimulations().catch(() => null);
    loadTrackingEntries().catch(() => null);
    loadLatestKit().catch(() => null);
    loadRiskIndicators().catch(() => null);
  }, [loadSimulations, loadTrackingEntries, loadLatestKit, loadRiskIndicators]);

  const activeAlerts = trackingEntries.filter(
    (e) => e.alertStatus === "WARNING" || e.alertStatus === "OVER_BUDGET",
  ).length;

  const riskIndicators = riskSnapshot?.riskIndicators as
    | Record<string, string>
    | undefined;
  const contextSimulation = activeSimulation ?? latestSimulation;

  const RISK_BADGE_COLOR: Record<string, string> = {
    LOW: "#16a34a",
    MODERATE: "#ca8a04",
    HIGH: "#ea580c",
    CRITICAL: "#dc2626",
  };

  return (
    <div className="s2-dashboard">
      <h2 className="s2-dashboard__title">{t("Your Relocation Tools")}</h2>
      <div className="s2-dashboard__grid">
        {/* Budget Zone */}
        <div className="s2-card">
          <span className="s2-card__icon">💰</span>
          <h3 className="s2-card__title">{t("Budget Simulator")}</h3>
          {contextSimulation ? (
            <p className="s2-card__info">
              {t("Latest")}: {contextSimulation.cityName} (
              {contextSimulation.planCode})
              {activeAlerts > 0 && (
                <span className="s2-alert-dot">
                  {" "}
                  · {activeAlerts} {t("alerts")}
                </span>
              )}
            </p>
          ) : (
            <p className="s2-card__info">{t("No simulations yet")}</p>
          )}
          <button
            className="s2-card__cta"
            onClick={() => router.push("/expats/budget")}
            type="button"
          >
            {t("Open Simulator")}
          </button>
        </div>

        {/* Starter Kit */}
        <div className="s2-card">
          <span className="s2-card__icon">📦</span>
          <h3 className="s2-card__title">{t("Starter Kit")}</h3>
          {starterKit ? (
            <p className="s2-card__info">
              {t("Generated on")}{" "}
              {new Date(starterKit.createdAt).toLocaleDateString()}
            </p>
          ) : (
            <p className="s2-card__info">{t("Not generated yet")}</p>
          )}
          <button
            className="s2-card__cta"
            onClick={() => router.push("/expats/starter-kit")}
            type="button"
          >
            {starterKit ? t("View Kit") : t("Generate Kit")}
          </button>
        </div>

        {/* Risk Overview */}
        <div className="s2-card">
          <span className="s2-card__icon">📊</span>
          <h3 className="s2-card__title">{t("Risk Overview")}</h3>
          {riskSnapshot ? (
            <div className="s2-risk-mini">
              {riskIndicators &&
                Object.entries(riskIndicators)
                  .slice(0, 3)
                  .map(([key, level]) => (
                    <span
                      key={key}
                      className="s2-risk-dot"
                      style={{ color: RISK_BADGE_COLOR[level] ?? "#6c778a" }}
                    >
                      ● {level}
                    </span>
                  ))}
              <span className="s2-burnout-mini">
                {t("Burnout")}: {riskSnapshot.burnoutIndex}/100
              </span>
            </div>
          ) : (
            <p className="s2-card__info">{t("Run a simulation first")}</p>
          )}
        </div>

        {/* Micro-test */}
        <div className="s2-card s2-card--microtest">
          <MicroTestCard />
        </div>
      </div>

      <style>{`
        .s2-dashboard {
          max-width: 1100px;
          margin: 32px auto 0;
          padding: 0 24px;
        }
        .s2-dashboard__title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 20px;
        }
        .s2-dashboard__grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        @media (max-width: 768px) {
          .s2-dashboard__grid { grid-template-columns: 1fr; }
        }
        .s2-card {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 14px;
          padding: 20px;
        }
        .s2-card--microtest {
          grid-column: 1 / -1;
        }
        .s2-card__icon {
          font-size: 1.5rem;
          display: block;
          margin-bottom: 8px;
        }
        .s2-card__title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0 0 8px;
        }
        .s2-card__info {
          font-size: 0.8125rem;
          color: #6c778a;
          margin: 0 0 14px;
        }
        .s2-alert-dot {
          color: #dc2626;
          font-weight: 700;
        }
        .s2-card__cta {
          display: inline-block;
          padding: 8px 20px;
          background: #f0f4ff;
          color: #3b6bdc;
          border: none;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .s2-card__cta:hover { background: #e0e8ff; }
        .s2-risk-mini {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 0.8125rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .s2-risk-dot { }
        .s2-burnout-mini {
          font-size: 0.75rem;
          color: #475569;
        }
      `}</style>
    </div>
  );
}

export default function ActivationPage() {
  const {
    activationState,
    onboarding,
    scoringResult,
    loadActivationState,
    loadOnboarding,
    createSnapshot,
    computeScoring,
    isLoading,
  } = useExpats();
  const { activeSimulation, latestSimulation, loadSimulations } = useBudget();
  const [actionInProgress, setActionInProgress] = useState(false);

  // Reload all data on mount and when window regains focus (e.g. returning from budget simulator)
  const refreshAll = useCallback(() => {
    loadActivationState().catch(() => null);
    loadOnboarding().catch(() => null);
    loadSimulations().catch(() => null);
  }, [loadActivationState, loadOnboarding, loadSimulations]);

  useEffect(() => {
    refreshAll();
    const handleFocus = () => refreshAll();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshAll]);

  // Auto-compute scoring when target city changes
  useEffect(() => {
    if (onboarding?.targetCityId) {
      computeScoring(onboarding.targetCityId).catch(() => null);
    }
  }, [onboarding?.targetCityId, computeScoring]);

  const router = useRouter();

  const handleNextAction = async (action: string) => {
    if (action === "complete_onboarding") {
      router.push("/expats/onboarding-preferences");
      return;
    }
    setActionInProgress(true);
    try {
      if (action === "create_snapshot") {
        await createSnapshot();
        await loadActivationState();
      } else if (action === "compute_scoring") {
        await computeScoring();
        await loadActivationState();
      } else if (action === "view_results") {
        // Scores already shown inline — scroll to them
        document
          .querySelector(".act-scoring-wrap")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      // Errors handled by store
    } finally {
      setActionInProgress(false);
    }
  };

  if (isLoading && !activationState) {
    return (
      <div className="act-loading">
        <div className="act-loading__spinner" />
        <p>Loading your plan…</p>
      </div>
    );
  }

  const userType = onboarding?.userType ?? activationState?.userType;
  const cityName =
    onboarding?.targetCityName ?? onboarding?.currentCityName ?? activeSimulation?.cityName ?? latestSimulation?.cityName ?? "Lisbon";
  const nextAction = activationState?.nextActions?.[0];
  const isComparison = !!(
    onboarding?.currentCityName &&
    onboarding?.targetCityName &&
    onboarding?.targetCityId
  );

  const contextSimulation = resolveContextSimulation(activeSimulation, latestSimulation, onboarding ?? null);
  const simOutput = contextSimulation?.outputPayload ?? {};
  const simInput = contextSimulation?.inputPayload ?? {};
  const budget = toNumber(simInput.monthlyBudget) ?? onboarding?.monthlyBudget ?? 2500;
  const estimatedCost = toNumber(simOutput.estimatedMonthlyCost ?? simOutput.totalMonthlyCost);

  // Dynamic data from scoring
  const targetScore = scoringResult?.scores?.find(
    (s) => s.cityName === onboarding?.targetCityName
  ) ?? scoringResult?.scores?.[0] ?? null;

  // Build dynamic macro comparison from scoring (for Comparison variant)
  const MACROAREA_KEYS = [
    { key: "costo_vita", label: "Cost Of Living" },
    { key: "mercato_immobiliare", label: "Housing Market" },
    { key: "potere_economico", label: "Economic Power" },
    { key: "qualita_vita", label: "Quality Of Life" },
    { key: "opportunita_lavorative", label: "Work Opportunities" },
    { key: "integrazione_sociale", label: "Social Integration" },
  ];

  const currentScore = scoringResult?.scores?.find(
    (s) => s.cityName === onboarding?.currentCityName
  ) ?? null;

  const dynamicComparison = (targetScore && currentScore) ? MACROAREA_KEYS.map((m) => {
    const tVal = ((targetScore.breakdown as Record<string, number>)?.[m.key] ?? 0);
    const cVal = ((currentScore.breakdown as Record<string, number>)?.[m.key] ?? 0);
    return {
      label: m.label,
      currentScore: cVal,
      targetScore: tVal,
      direction: tVal >= cVal ? "improvement" : "decline",
    };
  }) : null;

  const renderVariant = () => {
    if (isComparison) {
      return (
        <ActivationComparison
          currentCity={onboarding?.currentCityName ?? "Milan"}
          targetCity={onboarding?.targetCityName ?? "Valencia"}
          budget={budget}
          estimatedCost={estimatedCost ?? 2075}
          macroComparison={dynamicComparison ?? undefined}
        />
      );
    }
    if (userType === "already_in_city") {
      return (
        <ActivationAlreadyThere
          cityName={onboarding?.currentCityName ?? "Lisbon"}
          radarBreakdown={targetScore?.breakdown as Record<string, number> ?? null}
        />
      );
    }
    if (!onboarding?.targetCityName && !onboarding?.targetCityId) {
      return <ActivationUnsure topCity="Valencia" />;
    }
    return (
      <ActivationPlanningMove
        cityName={cityName}
        budget={budget}
        estimatedCost={estimatedCost ?? 2075}
      />
    );
  };

  return (
    <div className="activation-wrap">
      {/* Next action banner shown when there's a pending action */}
      {nextAction && nextAction.action !== "view_results" && (
        <div className="act-next-banner-wrap">
          <NextActionsBanner
            action={nextAction.action}
            description={nextAction.description}
            onAction={() => handleNextAction(nextAction.action)}
            isLoading={actionInProgress}
          />
        </div>
      )}

      {/* Real scoring results (shown when scores are computed) */}
      {activationState?.hasScoringResults && scoringResult?.scores?.length ? (
        <div className="act-scoring-wrap">
          <RealScoringCard scores={scoringResult.scores} />
        </div>
      ) : null}

      {renderVariant()}

      {/* ─── Sprint 2 Dashboard Sections ──────────────────────────────── */}
      <Sprint2Dashboard />

      <style>{`
        .activation-wrap {
          font-family: var(--font-geist-sans);
          color: #0d1b36;
          background: #f8fafd;
          min-height: 100vh;
        }
        .activation-main { max-width: 1100px; margin: 0 auto; padding: 0 24px 80px; }
        .activation-banner {
          display: flex; justify-content: center;
          padding: 20px 0;
          margin-bottom: 4px;
        }
        .activation-logo { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; color: #0d1b36; }
        .activation-logo__icon { font-size: 1.8rem; color: #3b6bdc; }
        .activation-header { text-align: center; margin-bottom: 36px; }
        .activation-title { font-size: 1.75rem; font-weight: 900; color: #0d1b36; margin-bottom: 12px; line-height: 1.25; }
        .activation-subtitle { font-size: 0.95rem; color: #3b6bdc; font-weight: 500; line-height: 1.6; }
        .activation-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          align-items: start;
        }
        .act-col { display: flex; flex-direction: column; gap: 16px; }
        .act-card {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 20px;
        }
        .act-card--warning { border-color: #f2c86b; }
        .act-card__img-area { text-align: center; margin-bottom: 12px; }
        .act-card__title { font-size: 0.95rem; font-weight: 700; margin-bottom: 10px; color: #0d1b36; }
        .act-card__subtitle { font-size: 0.85rem; color: #6c778a; margin-bottom: 10px; }
        .act-card__badge { display: inline-block; font-size: 0.85rem; font-weight: 700; padding: 4px 10px; border-radius: 50px; margin-bottom: 4px; }
        .act-card__badge--free { background: #e8f4ff; color: #3b6bdc; }
        .act-card__badge--premium { background: #fff8e8; color: #d4900a; }
        .act-badge-desc { font-size: 0.82rem; color: #6c778a; margin-bottom: 10px; }
        .act-month { margin-bottom: 12px; }
        .act-month__title { font-size: 0.85rem; margin-bottom: 4px; }
        .act-month__body { font-size: 0.82rem; color: #6c778a; line-height: 1.5; }
        .act-pro-item { font-size: 0.85rem; padding: 4px 0; color: #1a2433; }
        .act-check-item { font-size: 0.85rem; color: #22a55f; padding: 3px 0; }
        .act-kit-footer { font-size: 0.82rem; color: #6c778a; margin-top: 8px; }
        .act-mentor-preview { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .act-mentor-dot { width: 10px; height: 10px; border-radius: 50%; background: #9b59b6; flex-shrink: 0; }
        .act-mentor-label { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6c778a; }
        .act-mentor-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .act-mentor-avatar { width: 44px; height: 44px; border-radius: 50%; background: #f3f6fb; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
        .act-mentor-name { font-size: 0.95rem; font-weight: 700; margin: 0; }
        .act-mentor-route { font-size: 0.8rem; color: #6c778a; margin: 2px 0 0; }
        .act-mentor-insight { font-size: 0.85rem; color: #1a2433; margin-bottom: 12px; line-height: 1.5; }
        .act-mentor-tiers { font-size: 0.82rem; color: #6c778a; line-height: 1.8; }
        .act-budget-row { font-size: 0.85rem; color: #1a2433; padding: 3px 0; }
        .act-budget-result { font-size: 0.85rem; font-weight: 700; margin-top: 8px; padding: 6px 0; }
        .act-budget-result--ok { color: #22a55f; }
        .act-budget-result--risk { color: #e05555; }
        .act-cta-btn {
          width: 100%; background: #f07a30; color: #fff;
          border: none; border-radius: 50px;
          padding: 18px; font-size: 1rem; font-weight: 700;
          cursor: pointer; transition: background 0.2s;
        }
        .act-cta-btn:hover { background: #d96a20; }
        .act-loading {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 16px;
          font-size: 1rem; color: #6c778a;
        }
        .act-loading__spinner {
          width: 40px; height: 40px; border: 3px solid #e4e9f2;
          border-top-color: #3b6bdc; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .act-card--radar { display: flex; justify-content: center; }
        .act-lang-pill {
          position: absolute; top: 20px; right: 24px;
          background: #f3f6fb; border-radius: 8px; padding: 4px 12px;
          font-size: 0.9rem; cursor: pointer; color: #0d1b36;
        }

        /* NextActions Banner */
        .act-next-banner-wrap { max-width: 1100px; margin: 0 auto; padding: 16px 24px 0; }
        .act-next-banner {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          background: linear-gradient(135deg, #3b6bdc, #6b9fff);
          border-radius: 16px; padding: 20px 24px; color: #fff; margin-bottom: 8px;
        }
        .act-next-banner__left { display: flex; align-items: center; gap: 16px; }
        .act-next-banner__icon { font-size: 2rem; flex-shrink: 0; }
        .act-next-banner__title { font-size: 1rem; font-weight: 700; margin: 0 0 4px; }
        .act-next-banner__desc { font-size: 0.85rem; opacity: 0.85; margin: 0; }
        .act-next-banner__btn {
          background: #fff; color: #3b6bdc; border: none; border-radius: 50px;
          padding: 12px 28px; font-size: 0.9rem; font-weight: 700; cursor: pointer;
          white-space: nowrap; transition: opacity 0.2s;
        }
        .act-next-banner__btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Real scoring */
        .act-scoring-wrap { max-width: 480px; margin: 16px auto 0; padding: 0 24px; }
        .act-card--scoring { border-color: #3b6bdc; }
        .act-score-big { font-size: 2.5rem; font-weight: 900; color: #3b6bdc; }
        .act-score-label { font-size: 1rem; color: #6c778a; }
        .act-compat-badge {
          display: inline-block; color: #fff; font-size: 0.75rem; font-weight: 700;
          padding: 3px 12px; border-radius: 50px; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.04em;
        }
        .act-insights { margin-top: 12px; }
        .act-warning-item { font-size: 0.85rem; color: #e05555; padding: 3px 0; }

        /* Comparison bars */
        .act-comparison-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .act-comparison-label { font-size: 0.75rem; color: #6c778a; width: 100px; flex-shrink: 0; }
        .act-comparison-bars { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .act-bar { height: 6px; border-radius: 3px; transition: width 0.4s; }
        .act-bar--current { background: #b0bcd4; }
        .act-bar--target-good { background: #22a55f; }
        .act-bar--target-bad { background: #e05555; }
        .act-comparison-delta { font-size: 0.75rem; font-weight: 700; width: 28px; flex-shrink: 0; }
        .act-delta--up { color: #22a55f; }
        .act-delta--down { color: #e05555; }
        .act-budget-divider { height: 1px; background: #e4e9f2; margin: 12px 0; }

        @media (max-width: 900px) {
          .activation-grid { grid-template-columns: 1fr; }
          .activation-title { font-size: 1.4rem; }
          .act-next-banner { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
