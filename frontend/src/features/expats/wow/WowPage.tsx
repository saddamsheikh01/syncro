"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useMemo, useState } from "react";
import RadarChart from "./RadarChart";
import { useExpats } from "../../../hooks/expats/useExpats";
import { expatsActions, expatsStore } from "../../../stores/expats/expatsStore";
import {
  compareCities,
  getCities,
  getCityById,
  getFunnelConfig,
} from "../../../services/expats";
import type {
  CityScoreResponse,
  MacroareeScores,
  BudgetCheck,
  CityComparisonResponse,
  CityDetail,
} from "../../../types/expats";

const IMG = "/images/WOW-Page";

const MACROAREA_LABELS: Record<keyof MacroareeScores, { label: string; short: string }> = {
  costo_vita: { label: "Cost Of Living", short: "Cost\nOf Living" },
  potere_economico: { label: "Economic Power", short: "Economic\nPower" },
  qualita_vita: { label: "Quality Of Life", short: "Quality\nOf Life" },
  mercato_immobiliare: { label: "Housing Market", short: "Housing\nMarket" },
  integrazione_sociale: { label: "Social Integration", short: "Social\nIntegration" },
  opportunita_lavorative: { label: "Work Opportunities", short: "Work\nOpportunities" },
};

/** Display label for API macroarea key (e.g. costo_vita → "costo vita") — no fixed city copy. */
function macroareaLabelFromApi(macroarea: string): string {
  return macroarea.replace(/_/g, " ");
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

function extractFunnelWowCopy(config: unknown): { structuralTitle?: string } {
  if (!config || typeof config !== "object") return {};
  const c = config as Record<string, unknown>;
  const content = c.content as Record<string, unknown> | undefined;
  const flow = content?.flow_config as Record<string, unknown> | undefined;
  const t = flow?.wow_structural_plan_title ?? content?.wow_structural_plan_title;
  return typeof t === "string" && t.trim() ? { structuralTitle: t.trim() } : {};
}

function radarFromScore(score: CityScoreResponse | null) {
  const keys = Object.keys(MACROAREA_LABELS) as (keyof MacroareeScores)[];
  if (!score?.radarValues) {
    return keys.map((k) => ({
      label: MACROAREA_LABELS[k].label,
      shortLabel: MACROAREA_LABELS[k].short,
      value: 0,
    }));
  }
  const rv = score.radarValues;
  return keys.map((k) => ({
    label: MACROAREA_LABELS[k].label,
    shortLabel: MACROAREA_LABELS[k].short,
    value: Math.round(Number(rv[k]) || 0),
  }));
}

function compatLabel(level: string | undefined, score: number) {
  if (level === "VERY_STRONG_FIT") return { text: "Excellent Match", color: "#22a55f" };
  if (level === "GOOD_FIT") return { text: "Very Strong Fit", color: "#3b6bdc" };
  if (level === "MODERATE_FIT") return { text: "Good Fit", color: "#2f9e6a" };
  if (level === "WEAK_FIT") return { text: "Moderate Fit", color: "#f2b203" };
  if (level === "LOW_FIT") return { text: "Weak Fit", color: "#e05555" };
  if (score >= 90) return { text: "Excellent Match", color: "#22a55f" };
  if (score >= 80) return { text: "Very Strong Fit", color: "#3b6bdc" };
  if (score >= 70) return { text: "Good Fit", color: "#2f9e6a" };
  if (score >= 60) return { text: "Moderate Fit", color: "#f2b203" };
  return { text: "Weak Fit", color: "#e05555" };
}

function budgetClassLabel(marginStatusOrClassification: string | undefined) {
  if (marginStatusOrClassification === "sustainable") return { text: "Sustainable with your budget", color: "#22a55f" };
  if (marginStatusOrClassification === "tight" || marginStatusOrClassification === "very_tight") return { text: "Tight, but manageable", color: "#f2b203" };
  if (marginStatusOrClassification === "unsustainable") return { text: "Over budget — adjustments needed", color: "#e05555" };
  return { text: "Over budget — adjustments needed", color: "#e05555" };
}

function structuralBulletsFromApi(score: CityScoreResponse | null): string[] {
  const out: string[] = [];
  const b = score?.budgetCheck;
  if (b?.suggestions?.length) out.push(...b.suggestions.slice(0, 3));
  const ins = score?.insights;
  const w = ins && typeof ins === "object" && "warnings" in ins && Array.isArray((ins as { warnings: string[] }).warnings)
    ? (ins as { warnings: string[] }).warnings
    : [];
  for (const x of w) {
    if (out.length >= 3) break;
    if (!out.includes(x)) out.push(x);
  }
  const st = ins && typeof ins === "object" && "strengths" in ins && Array.isArray((ins as { strengths: unknown[] }).strengths)
    ? (ins as { strengths: unknown[] }).strengths
    : [];
  for (const x of st) {
    if (out.length >= 3) break;
    const line =
      typeof x === "string"
        ? x
        : x && typeof x === "object" && "message" in x && typeof (x as { message: string }).message === "string"
          ? (x as { message: string }).message
          : "";
    if (line && !out.includes(line)) out.push(line);
  }
  return out.slice(0, 3);
}

// ─── WOW Page – Planning Move ─────────────────────────────────────────────────

function WowPlanningMove({
  cityName,
  score,
  funnelBudget,
  completionPercent,
  districts,
  structuralTitleFromConfig,
  nextActionDescription,
}: {
  cityName: string;
  score: CityScoreResponse | null;
  funnelBudget: number | null;
  completionPercent: number | null;
  districts: { name: string; description?: string }[];
  structuralTitleFromConfig?: string | null;
  nextActionDescription?: string | null;
}) {
  const router = useRouter();
  const totalScore = score?.scoreTotal ?? 0;
  const compat = compatLabel(score?.compatibilityLevel, totalScore);
  const radar = radarFromScore(score);
  const rawBudget = score?.budgetCheck;
  const hasBudget = rawBudget && (rawBudget.estimatedCityCost != null || rawBudget.estimatedCost != null);
  const estimatedCost = hasBudget ? rawBudget.estimatedCityCost ?? rawBudget.estimatedCost ?? 0 : 0;
  const budgetLabel = hasBudget && rawBudget ? budgetClassLabel(rawBudget.marginStatus ?? rawBudget.classification) : null;
  const insights = score?.insights;
  const firstStrength =
    Array.isArray(insights?.strengths) && typeof insights.strengths[0] === "string" ? insights.strengths[0] : null;
  const firstInsightMessage: string | undefined =
    insights?.suggestions?.[0] ??
    (Array.isArray((insights as { insights?: { message?: string }[] })?.insights)
      ? (insights as { insights: { message?: string }[] }).insights[0]?.message
      : undefined);
  const profilePct = completionPercent != null ? Math.min(100, Math.max(0, completionPercent)) : null;
  const cityFitDisplay = totalScore > 0 ? totalScore : null;
  const structural = structuralBulletsFromApi(score);
  const districtNames = districts.slice(0, 5).map((d) => d.name);
  const structuralCardTitle =
    structuralTitleFromConfig ||
    (score?.rankingPosition != null ? `Match rank #${score.rankingPosition}` : null) ||
    nextActionDescription ||
    (structural.length > 0 ? firstStrength : null);

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">
          {cityName}
          {totalScore > 0 ? ` — ${totalScore}% city fit` : ""}
        </h1>
        <p className="wow-sub">
          {firstStrength ||
            firstInsightMessage ||
            (score?.compatibilityLevel
              ? `Compatibility: ${compat.text.replace(/\n/g, " ")}`
              : nextActionDescription || "Results update as scoring completes.")}
        </p>
      </div>

      <div className="wow-grid wow-grid--3">
        <div className="wow-col">
          <div className="wow-card wow-card--row">
            <img src={`${IMG}/image%202308.png`} alt="Zyra" className="wow-avatar" />
            <div>
              <p className="wow-bold">Hello! I&apos;m Zyra,</p>
              <p className="wow-muted-sm">Your AI Mentor Here.</p>
            </div>
          </div>

          <div className="wow-card">
            <div className="wow-card--row" style={{ marginBottom: 12 }}>
              <img src={`${IMG}/image%202441.png`} alt="" className="wow-icon-40" />
              <div>
                <p className="wow-muted-sm" style={{ fontWeight: 700, color: "#0d1b36" }}>Profile & city fit</p>
                <p className="wow-big-num">
                  {profilePct != null ? (
                    <>
                      {profilePct}
                      <span className="wow-big-num__sub">% profile</span>
                    </>
                  ) : cityFitDisplay != null ? (
                    <>
                      {cityFitDisplay}
                      <span className="wow-big-num__sub">/100 city</span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
            <img src={`${IMG}/image%202440.png`} alt="" className="wow-gauge-img" />
            <p className="wow-muted-sm" style={{ marginTop: 8 }}>
              {score?.compatibilityLevel
                ? `${compat.text.replace(/\n/g, " ")}`
                : nextActionDescription || "Complete onboarding after sign-up for full metrics."}
            </p>
            <span className="wow-badge-orange" style={{ background: `${compat.color}22`, color: compat.color }}>
              {compat.text}
            </span>
          </div>

          <div className="wow-card wow-card--center">
            <img src={`${IMG}/Rectangle%203465283.png`} alt="" className="wow-img-120" />
            {structuralCardTitle ? <p className="wow-bold">{structuralCardTitle}</p> : null}
            {structural.length > 0 ? (
              <ul className="wow-accent-list">
                {structural.map((s) => (
                  <li key={s.slice(0, 48)}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="wow-muted-sm">{nextActionDescription || "More detail appears after registration and profile completion."}</p>
            )}
          </div>
        </div>

        <div className="wow-col">
          <h2 className="wow-section-title">{cityName} Compatibility Overview</h2>
          <div className="wow-city-hero">
            <img src={`${IMG}/Rectangle%203465225.png`} alt={cityName} className="wow-city-hero__img" />
            <span className="wow-compat-badge" style={{ background: compat.color }}>
              {totalScore > 0 ? `${totalScore}% ${compat.text}` : "Score loading…"}
            </span>
          </div>

          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 8 }}>Connect With Compatible Locals And Mentors</p>
            <p className="wow-muted-sm">Create your free account to see people matched to your relocation phase and city.</p>
            <img src={`${IMG}/Group%201686559670.png`} alt="Mentors" className="wow-mentors-row" />
          </div>

          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 8 }}>Your Full Relocation Analysis Includes</p>
            <img src={`${IMG}/image%202436.png`} alt="Neighbourhoods" className="wow-img-160" style={{ margin: "8px auto" }} />
            <p className="wow-muted-sm">Neighbourhoods from our city dataset</p>
            {districtNames.length > 0 ? (
              <ul className="wow-accent-list">
                {districtNames.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="wow-muted-sm">District data loads when scoring completes for this city.</p>
            )}
          </div>

          <button type="button" onClick={() => router.push("/register?from=expats")} className="wow-cta">
            See My Full Relocation Analysis
          </button>
          <p className="wow-cta-sub">🔒 Free account · Personalized results · No credit card required</p>
        </div>

        <div className="wow-col">
          <div className="wow-card wow-card--center">
            <p className="wow-bold">
              {cityName} Compatibility <span className="wow-accent">Breakdown</span>
            </p>
            <RadarChart data={radar} size={240} color="#3b6bdc" />
          </div>

          <div className="wow-card wow-card--center">
            <img src={`${IMG}/Rectangle%203464893.png`} alt="" className="wow-img-100" />
            <p className="wow-bold">Financial Comfort Index</p>
            {firstInsightMessage && <p className="wow-muted-sm">{firstInsightMessage}</p>}
            <p className="wow-muted-sm">Estimated Monthly Reality</p>
            {estimatedCost > 0 && budgetLabel ? (
              <>
                <p className="wow-budget-line">{formatEur(estimatedCost)} estimated monthly need (dataset + your lifestyle inputs)</p>
                <p className="wow-budget-check" style={{ color: budgetLabel.color }}>
                  ✓ {budgetLabel.text}
                </p>
              </>
            ) : (
              <p className="wow-muted-sm">Budget check comes from your declared budget and city cost data after scoring.</p>
            )}
            <div className="wow-insight-box">
              <strong>Insight:</strong>{" "}
              {firstInsightMessage || firstStrength || `Analysis for ${cityName} — sign in for full report.`}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── WOW Page – Already There ─────────────────────────────────────────────────

function WowAlreadyThere({
  cityName,
  score,
  completionPercent,
  districts,
  structuralTitleFromConfig,
  nextActionDescription,
}: {
  cityName: string;
  score: CityScoreResponse | null;
  completionPercent: number | null;
  districts: { name: string }[];
  structuralTitleFromConfig?: string | null;
  nextActionDescription?: string | null;
}) {
  const router = useRouter();
  const radar = radarFromScore(score);
  const rawBudget = score?.budgetCheck;
  const estimatedCost = rawBudget ? rawBudget.estimatedCityCost ?? rawBudget.estimatedCost ?? 0 : 0;
  const budgetLabel = budgetClassLabel(rawBudget?.marginStatus ?? rawBudget?.classification);
  const structural = structuralBulletsFromApi(score);
  const districtNames = districts.slice(0, 5).map((d) => d.name);
  const profilePct = completionPercent != null ? Math.min(100, Math.max(0, completionPercent)) : null;
  const ins = score?.insights;
  const sub =
    (Array.isArray(ins?.strengths) && ins.strengths[0] && typeof ins.strengths[0] === "string" ? ins.strengths[0] : null) ||
    nextActionDescription ||
    (score?.scoreTotal != null ? `City analysis score: ${score.scoreTotal}/100` : null);

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">{cityName}</h1>
        <p className="wow-sub">{sub || "Your latest scoring and profile data for this city."}</p>
      </div>
      <div className="wow-grid wow-grid--3">
        <div className="wow-col">
          <div className="wow-card wow-card--row">
            <img src={`${IMG}/image%202308.png`} alt="Zyra" className="wow-avatar" />
            <div>
              <p className="wow-bold">Hello! I&apos;m Zyra,</p>
              <p className="wow-muted-sm">Your AI Mentor Here.</p>
            </div>
          </div>
          <div className="wow-card">
            {profilePct != null && <p className="wow-muted-sm">Profile completion: {profilePct}%</p>}
            {score?.compatibilityLevel && (
              <p className="wow-body-text">Compatibility level: {score.compatibilityLevel.replace(/_/g, " ")}</p>
            )}
          </div>
          <div className="wow-card wow-card--center">
            <img src={`${IMG}/Rectangle%203465283.png`} alt="" className="wow-img-120" />
            {(structuralTitleFromConfig ||
              (score?.rankingPosition != null ? `Rank #${score.rankingPosition}` : null) ||
              nextActionDescription) && (
              <p className="wow-bold">
                {structuralTitleFromConfig ||
                  (score?.rankingPosition != null ? `Match rank #${score.rankingPosition}` : nextActionDescription)}
              </p>
            )}
            {structural.length > 0 ? (
              <ul className="wow-accent-list">
                {structural.map((s) => (
                  <li key={s.slice(0, 48)}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="wow-muted-sm">{nextActionDescription || "Additional recommendations after you sign in."}</p>
            )}
          </div>
        </div>

        <div className="wow-col">
          <div className="wow-card wow-card--center">
            <h2 className="wow-section-title">Your {cityName} Alignment Map</h2>
            <img src={`${IMG}/image%202430.png`} alt="" className="wow-img-100" />
            <p className="wow-muted-sm" style={{ textAlign: "center", lineHeight: 1.6 }}>
              Macro-area scores from your latest run (radar below).
            </p>
          </div>
          <div className="wow-card">
            <p className="wow-bold-sm">{nextActionDescription || "Next step after registration"}</p>
            <p className="wow-muted-sm">Mentor matching unlocks in the main app.</p>
          </div>
          <div className="wow-card">
            <p className="wow-bold">Neighborhoods To Explore Next</p>
            {districtNames.length > 0 ? (
              <ul className="wow-accent-list">
                {districtNames.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="wow-muted-sm">Loading district data from your city profile…</p>
            )}
          </div>
          <button type="button" onClick={() => router.push("/register?from=expats")} className="wow-cta">
            See My Full {cityName} Analysis →
          </button>
          <p className="wow-cta-sub">Preview unlocked. Full system activates after registration.</p>
        </div>

        <div className="wow-col">
          <div className="wow-card wow-card--center">
            <p className="wow-bold">
              {cityName} Compatibility <span className="wow-accent">Breakdown</span>
            </p>
            <RadarChart data={radar} size={220} color="#3b6bdc" />
          </div>
          <div className="wow-card wow-card--center">
            <img src={`${IMG}/image%202428.png`} alt="" className="wow-img-60" />
            <p className="wow-bold">Financial Comfort Index</p>
            {estimatedCost > 0 ? (
              <>
                <p className="wow-budget-line">{formatEur(estimatedCost)} estimated monthly need</p>
                <p className="wow-budget-check" style={{ color: budgetLabel.color }}>
                  ✓ {budgetLabel.text}
                </p>
              </>
            ) : (
              <p className="wow-muted-sm">Financial breakdown from your latest city score.</p>
            )}
            <div className="wow-insight-box">
              <strong>Insight:</strong>{" "}
              {(Array.isArray(score?.insights?.suggestions) && score.insights.suggestions[0]) ||
                "Re-run scoring after profile changes for updated numbers."}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── WOW Page – Comparison ────────────────────────────────────────────────────

function WowComparison({
  comparison,
  currentCityName,
  targetCityName,
  targetScore,
  targetDistricts,
}: {
  comparison: CityComparisonResponse | null;
  currentCityName: string;
  targetCityName: string;
  targetScore: CityScoreResponse | null;
  targetDistricts: { name: string }[];
}) {
  const router = useRouter();
  const radar = radarFromScore(targetScore);
  const cur = comparison?.currentCity?.name ?? currentCityName;
  const tgt = comparison?.targetCity?.name ?? targetCityName;
  const macroRows = comparison?.macroareeComparison ?? [];
  const econ = comparison?.economicImpact;
  const tradeBullets = comparison?.tradeOffs?.slice(0, 4) ?? [];
  const winnerSummary = comparison?.overallImpact?.summary ?? comparison?.priorityAlignment?.summary;

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">
          How Would Your Life Change If You Moved From {cur} To {tgt}?
        </h1>
        <p className="wow-sub">
          {winnerSummary ||
            (targetScore?.insights && typeof targetScore.insights === "object" && "suggestions" in targetScore.insights
              ? (targetScore.insights as { suggestions?: string[] }).suggestions?.[0]
              : null) ||
            `Comparing ${cur} and ${tgt} from your profile and city dataset.`}
        </p>
      </div>

      <div className="wow-grid wow-grid--3c">
        <div className="wow-col">
          <div className="wow-card wow-card--center">
            {comparison?.overallImpact?.compatibilityLevelTarget && (
              <p className="wow-muted-sm" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, fontStyle: "italic" }}>
                Target fit: {comparison.overallImpact.compatibilityLevelTarget.replace(/_/g, " ")}
              </p>
            )}
            <img src={`${IMG}/image%202425.png`} alt="Trophy" className="wow-img-60" />
            <h2 className="wow-winner-city">{tgt.toUpperCase()}</h2>
            {tradeBullets.length > 0 ? (
              <ul className="wow-accent-list" style={{ textAlign: "left" }}>
                {tradeBullets.map((t) => (
                  <li key={t.macroarea}>{t.message}</li>
                ))}
              </ul>
            ) : (
              <ul className="wow-accent-list">
                <li>{comparison?.priorityAlignment?.summary || `Add both cities to your profile and create a snapshot to load the full comparison.`}</li>
              </ul>
            )}
          </div>
          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 8 }}>
              {tgt} — districts ({targetDistricts.length || "…"})
            </p>
            <img src={`${IMG}/image%202436.png`} alt="" className="wow-img-160" style={{ margin: "8px auto" }} />
            {targetDistricts.length > 0 ? (
              <ul className="wow-accent-list">
                {targetDistricts.slice(0, 5).map((d) => (
                  <li key={d.name}>{d.name}</li>
                ))}
              </ul>
            ) : (
              <p className="wow-muted-sm">District list loads from the city catalog for {tgt}.</p>
            )}
          </div>
        </div>

        <div className="wow-col">
          <div className="wow-compare-cities">
            <img src={`${IMG}/Rectangle%203465225%20(1).png`} alt={cur} className="wow-compare-img" />
            <img src={`${IMG}/Rectangle%203465253.png`} alt={tgt} className="wow-compare-img" />
          </div>
          {macroRows.length > 0 ? (
            <div className="wow-compare-table">
              <div className="wow-compare-hdr">
                <div />
                <div className="wow-compare-hdr__city">{cur.toUpperCase()}</div>
                <div className="wow-compare-hdr__city">{tgt.toUpperCase()}</div>
              </div>
              {macroRows.map((r) => {
                const label = macroareaLabelFromApi(String(r.macroarea));
                const tBetter = r.direction === "improvement";
                return (
                  <div key={r.macroarea} className="wow-compare-row">
                    <div className="wow-compare-row__label">{label}</div>
                    <div className={`wow-compare-row__val ${!tBetter && r.direction === "decline" ? "wow-compare-row__val--win" : ""}`}>
                      {Number(r.currentCityScore).toFixed(0)}
                    </div>
                    <div className={`wow-compare-row__val ${tBetter ? "wow-compare-row__val--win" : ""}`}>
                      {Number(r.targetCityScore).toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="wow-card">
              <p className="wow-muted-sm">
                {comparison?.priorityAlignment?.summary ||
                  "Macro-area scores appear here once the comparison API returns data for both saved cities."}
              </p>
            </div>
          )}
          {econ && (
            <div className="wow-card wow-card--center">
              <p className="wow-bold-sm">Your Monthly Life Simulation</p>
              <div className="wow-economy-row">
                <div className="wow-economy-col">
                  <strong>{cur}</strong>
                  <p className="wow-economy-price">{formatEur(Number(econ.currentCityCost))}</p>
                </div>
                <div className="wow-economy-col">
                  <strong>{tgt}</strong>
                  <p className="wow-economy-price">{formatEur(Number(econ.targetCityCost))}</p>
                </div>
              </div>
              <p className="wow-muted-sm">
                {econ.summary}
                {econ.monthlySaving !== 0 && (
                  <>
                    {" "}
                    <strong style={{ color: econ.monthlySaving > 0 ? "#22a55f" : "#e05555" }}>
                      {econ.monthlySaving > 0 ? "+" : ""}
                      {formatEur(Math.abs(econ.monthlySaving))}/mo
                    </strong>
                  </>
                )}
              </p>
            </div>
          )}
          <button type="button" onClick={() => router.push("/register?from=expats")} className="wow-cta">
            See My Full Relocation Analysis
          </button>
        </div>

        <div className="wow-col">
          <div className="wow-card wow-card--row">
            <img src={`${IMG}/image%202308.png`} alt="Zyra" className="wow-avatar" />
            <div>
              <p className="wow-bold">Hello! I&apos;m Zyra,</p>
              <p className="wow-muted-sm">Your AI Mentor Here.</p>
            </div>
          </div>
          <div className="wow-card wow-card--center">
            <p className="wow-bold">
              {tgt} Compatibility <span className="wow-accent">Breakdown</span>
            </p>
            <RadarChart data={radar} size={200} color="#3b6bdc" />
          </div>
          <div className="wow-card">
            <div className="wow-card--row" style={{ marginBottom: 8 }}>
              <img src={`${IMG}/image%202441.png`} alt="" className="wow-icon-40" />
              <div>
                <p className="wow-muted-sm" style={{ fontWeight: 700, color: "#0d1b36" }}>Target city fit</p>
                <p className="wow-big-num">
                  {comparison?.overallImpact?.scoreTargetCity ?? targetScore?.scoreTotal ?? "—"}
                  {typeof (comparison?.overallImpact?.scoreTargetCity ?? targetScore?.scoreTotal) === "number" ? (
                    <span className="wow-big-num__sub">/100</span>
                  ) : null}
                </p>
              </div>
            </div>
            <p className="wow-muted-sm">
              {comparison?.overallImpact?.compatibilityLevelTarget
                ? `Compatibility: ${comparison.overallImpact.compatibilityLevelTarget.replace(/_/g, " ")}`
                : targetScore?.compatibilityLevel
                  ? `Compatibility: ${targetScore.compatibilityLevel.replace(/_/g, " ")}`
                  : targetScore?.compatibilityLevel
                    ? targetScore.compatibilityLevel.replace(/_/g, " ")
                    : "—"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── WOW Page – Unsure ────────────────────────────────────────────────────────

function WowUnsure({ scores }: { scores: CityScoreResponse[] | undefined }) {
  const router = useRouter();
  const TOP_CITIES = useMemo(() => {
    if (!scores?.length) return [];
    return scores.slice(0, 3).map((s, i) => ({
      name: s.cityName,
      country: s.country,
      score: s.scoreTotal,
      radar: radarFromScore(s),
      img:
        i === 0
          ? `${IMG}/Rectangle%203465253.png`
          : i === 1
            ? `${IMG}/Rectangle%203465225.png`
            : `${IMG}/Rectangle%203465253.png`,
    }));
  }, [scores]);

  if (TOP_CITIES.length === 0) {
    return (
      <>
        <div className="wow-header">
          <h1 className="wow-title">City rankings</h1>
          <p className="wow-muted-sm">
            After you sign in, complete your profile, create a snapshot, and run scoring — your ranked cities will show here.
          </p>
        </div>
        <button type="button" onClick={() => router.push("/register?from=expats")} className="wow-cta" style={{ marginTop: 32 }}>
          Register to unlock rankings
        </button>
      </>
    );
  }

  const topNames = scores?.slice(0, 3).map((s) => s.cityName).filter(Boolean).join(", ") ?? "";

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">Top matches</h1>
        <p className="wow-sub">
          {scores?.length ? `${scores.length} cities scored. Highlights: ${topNames}.` : ""}
        </p>
      </div>
      <div className="wow-unsure-grid">
        {TOP_CITIES.map((city, i) => (
          <div key={`${city.name}-${i}`} className={`wow-city-card ${i === 0 ? "wow-city-card--top" : ""}`}>
            <div className="wow-city-rank">#{i + 1}</div>
            <img src={city.img} alt={city.name} className="wow-city-card__img" />
            <div className="wow-city-card__body">
              <h3 className="wow-bold">🌍 {city.name}</h3>
              <p className="wow-muted-sm">{city.country}</p>
              <div className="wow-score-bar">
                <div className="wow-score-fill" style={{ width: `${Math.min(100, city.score)}%` }} />
              </div>
              <p className="wow-muted-sm">
                <strong>{city.score}%</strong> Compatibility
              </p>
            </div>
            <div style={{ padding: "0 16px 16px", textAlign: "center" }}>
              <RadarChart data={city.radar} size={160} color="#3b6bdc" />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => router.push("/register?from=expats")} className="wow-cta" style={{ marginTop: 32 }}>
        See My Full City Rankings
      </button>
      <p className="wow-cta-sub">{scores?.length ? `Showing 3 of ${scores.length} ranked cities.` : ""}</p>
    </>
  );
}

// ─── Main WOW Page ────────────────────────────────────────────────────────────

export default function WowPage() {
  const router = useRouter();
  const { funnelAnswers, scoringResult, initSession, session, onboarding, activationState } = useExpats();
  const initialized = useRef(false);
  const scoringPipeline = useRef(false);
  const [districtCity, setDistrictCity] = useState<CityDetail | null>(null);
  const [comparison, setComparison] = useState<CityComparisonResponse | null>(null);
  const [comparisonTargetDistricts, setComparisonTargetDistricts] = useState<{ name: string }[]>([]);
  const [structuralTitleFromFunnel, setStructuralTitleFromFunnel] = useState<string | null>(null);

  const nextActionDescription = activationState?.nextActions?.[0]?.description ?? null;

  useEffect(() => {
    getFunnelConfig()
      .then((cfg) => setStructuralTitleFromFunnel(extractFunnelWowCopy(cfg).structuralTitle ?? null))
      .catch(() => setStructuralTitleFromFunnel(null));
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initSession().catch(() => {
        router.replace("/expats");
      });
    }
  }, [initSession, router]);

  useEffect(() => {
    if (!session || scoringPipeline.current) return;
    scoringPipeline.current = true;
    (async () => {
      await expatsActions.loadOnboarding().catch(() => {});
      await expatsActions.loadActivationState().catch(() => {});
      const state = expatsStore.getState();
      const ob = state.onboarding;
      const funnel = state.funnelAnswers;
      let targetId: string | undefined = ob?.targetCityId ?? undefined;
      const resolveCityId = async (name: string) => {
        const cities = await getCities();
        const n = name.trim().toLowerCase();
        return cities.find(
          (c) => c.cityName.toLowerCase() === n || c.citySlug === n.replace(/\s+/g, "-").toLowerCase()
        )?.id;
      };
      if (!targetId && funnel.targetCityName?.trim()) {
        try {
          targetId = await resolveCityId(funnel.targetCityName);
        } catch {
          /* ignore */
        }
      }
      if (
        !targetId &&
        (funnel.userPhase === "already_there" || funnel.userPhase === "recently_moved") &&
        funnel.currentCityName?.trim()
      ) {
        try {
          targetId = await resolveCityId(funnel.currentCityName);
        } catch {
          /* ignore */
        }
      }
      try {
        if (targetId) await expatsActions.computeScoring(targetId);
        else await expatsActions.computeScoring();
      } catch {
        /* anonymous may 401; session token may still work */
      }
    })();
  }, [session]);

  useEffect(() => {
    const ob = onboarding;
    if (!ob?.currentCityId || !ob?.targetCityId) {
      setComparison(null);
      return;
    }
    if (funnelAnswers.targetType !== "specific_city") return;
    let cancelled = false;
    compareCities({ currentCityId: ob.currentCityId, targetCityId: ob.targetCityId })
      .then((c) => {
        if (!cancelled) setComparison(c);
      })
      .catch(() => {
        if (!cancelled) setComparison(null);
      });
    return () => {
      cancelled = true;
    };
  }, [onboarding?.currentCityId, onboarding?.targetCityId, funnelAnswers.targetType]);

  useEffect(() => {
    const tid = comparison?.targetCity?.id;
    if (!tid) {
      setComparisonTargetDistricts([]);
      return;
    }
    let cancelled = false;
    getCityById(tid)
      .then((d) => {
        if (!cancelled) setComparisonTargetDistricts(d.districts ?? []);
      })
      .catch(() => {
        if (!cancelled) setComparisonTargetDistricts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [comparison?.targetCity?.id]);

  const primaryScore = useMemo(() => {
    const scores = scoringResult?.scores ?? [];
    if (!scores.length) return null;
    if (onboarding?.targetCityId) {
      const s = scores.find((x) => x.cityId === onboarding.targetCityId);
      if (s) return s;
    }
    if (funnelAnswers.targetCityName?.trim()) {
      const n = funnelAnswers.targetCityName.trim().toLowerCase();
      const s = scores.find((x) => x.cityName?.toLowerCase() === n);
      if (s) return s;
    }
    return scores[0];
  }, [scoringResult, onboarding, funnelAnswers.targetCityName]);

  useEffect(() => {
    const id = primaryScore?.cityId;
    if (!id) {
      setDistrictCity(null);
      return;
    }
    let cancelled = false;
    getCityById(id)
      .then((d) => {
        if (!cancelled) setDistrictCity(d);
      })
      .catch(() => {
        if (!cancelled) setDistrictCity(null);
      });
    return () => {
      cancelled = true;
    };
  }, [primaryScore?.cityId]);

  const userPhase = funnelAnswers.userPhase;
  const targetType = funnelAnswers.targetType;
  const funnelTarget = funnelAnswers.targetCityName?.trim() ?? "";
  const funnelCurrent = funnelAnswers.currentCityName?.trim() ?? "";

  const cityDisplay =
    primaryScore?.cityName ||
    onboarding?.targetCityName ||
    funnelTarget ||
    onboarding?.currentCityName ||
    funnelCurrent ||
    "";

  const completionPercent =
    onboarding?.completionPercent ??
    (onboarding?.completedSteps != null ? Math.round((onboarding.completedSteps / 10) * 100) : null);

  const districts = districtCity?.districts ?? [];

  const renderContent = () => {
    if (userPhase === "already_there") {
      return (
        <WowAlreadyThere
          cityName={onboarding?.currentCityName || funnelCurrent || cityDisplay || "…"}
          score={primaryScore}
          completionPercent={completionPercent}
          districts={districts}
          structuralTitleFromConfig={structuralTitleFromFunnel}
          nextActionDescription={nextActionDescription}
        />
      );
    }
    if (targetType === "not_sure") {
      return <WowUnsure scores={scoringResult?.scores} />;
    }
    if (targetType === "already_live") {
      return (
        <WowAlreadyThere
          cityName={onboarding?.currentCityName || funnelCurrent || cityDisplay || "…"}
          score={primaryScore}
          completionPercent={completionPercent}
          districts={districts}
          structuralTitleFromConfig={structuralTitleFromFunnel}
          nextActionDescription={nextActionDescription}
        />
      );
    }
    if (funnelTarget && funnelCurrent && targetType === "specific_city") {
      return (
        <WowComparison
          comparison={comparison}
          currentCityName={comparison?.currentCity.name ?? funnelCurrent}
          targetCityName={comparison?.targetCity.name ?? funnelTarget}
          targetScore={primaryScore}
          targetDistricts={comparisonTargetDistricts}
        />
      );
    }
    return (
      <WowPlanningMove
        cityName={cityDisplay || "…"}
        score={primaryScore}
        funnelBudget={onboarding?.monthlyBudget ?? funnelAnswers.monthlyBudget ?? null}
        completionPercent={completionPercent}
        districts={districts}
        structuralTitleFromConfig={structuralTitleFromFunnel}
        nextActionDescription={nextActionDescription}
      />
    );
  };

  return (
    <div className="wow-page">
      <header className="wow-topbar">
        <div className="wow-lang-btn">
          <img src={`${IMG}/image%202424.png`} alt="" className="wow-lang-flag" />
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
            <path d="M1 1L5 5L9 1" stroke="#6c778a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="wow-logo">
          <span className="wow-logo__sym">∞</span>
          <span className="wow-logo__txt">
            <strong>EXPATS</strong> MODE
          </span>
        </div>
        <div style={{ width: 60 }} />
      </header>

      <main className="wow-main">{renderContent()}</main>

      <style>{`
        .wow-page{min-height:100vh;background:#f7f9fc;font-family:'Inter',var(--font-geist-sans,system-ui,sans-serif);color:#0d1b36}
        .wow-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 32px;background:#fff;border-bottom:1px solid #e8ecf4;position:sticky;top:0;z-index:10}
        .wow-logo{display:flex;align-items:center;gap:8px;font-size:1.05rem;color:#0d1b36}
        .wow-logo__sym{font-size:1.6rem;color:#3b6bdc}
        .wow-lang-btn{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e4e9f2;border-radius:10px;padding:7px 12px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.05)}
        .wow-lang-flag{width:30px;height:20px;object-fit:cover;border-radius:2px}
        .wow-main{max-width:1180px;margin:0 auto;padding:36px 24px 80px}
        .wow-header{text-align:center;margin-bottom:36px}
        .wow-title{font-size:1.85rem;font-weight:800;line-height:1.25;margin-bottom:10px}
        .wow-sub{font-size:.95rem;color:#6c778a;line-height:1.6}
        .wow-section-title{font-size:1.1rem;font-weight:700;margin-bottom:14px}
        .wow-bold{font-size:.95rem;font-weight:700;margin:0}
        .wow-bold-sm{font-size:.88rem;font-weight:700;margin:0 0 6px}
        .wow-muted-sm{font-size:.82rem;color:#6c778a;margin:2px 0;line-height:1.5}
        .wow-body-text{font-size:.9rem;line-height:1.65;color:#1a2433}
        .wow-accent{color:#3b6bdc}
        .wow-big-num{font-size:1.6rem;font-weight:900;margin:0}
        .wow-big-num__sub{font-size:.85rem;font-weight:600;color:#6c778a}
        .wow-grid--3{display:grid;grid-template-columns:255px 1fr 275px;gap:18px;align-items:start}
        .wow-grid--3c{display:grid;grid-template-columns:230px 1fr 255px;gap:18px;align-items:start}
        .wow-col{display:flex;flex-direction:column;gap:16px}
        .wow-card{background:#fff;border:1px solid #e8ecf4;border-radius:14px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.03)}
        .wow-card--row{display:flex;align-items:center;gap:12px}
        .wow-card--center{text-align:center}
        .wow-avatar{width:48px;height:48px;object-fit:contain;flex-shrink:0}
        .wow-icon-40{width:42px;height:42px;object-fit:contain;flex-shrink:0}
        .wow-gauge-img{width:100%;height:24px;object-fit:contain;margin:4px 0}
        .wow-img-60{width:60px;height:60px;object-fit:contain;margin:8px auto;display:block}
        .wow-img-100{width:100px;height:auto;object-fit:contain;margin:0 auto 10px;display:block}
        .wow-img-120{width:120px;height:auto;object-fit:contain;margin:0 auto 10px;display:block}
        .wow-img-160{width:160px;height:auto;object-fit:contain;display:block}
        .wow-mentors-row{width:100%;max-width:220px;height:auto;margin:12px auto 0;display:block}
        .wow-city-hero{position:relative;border-radius:14px;overflow:hidden;margin-bottom:14px}
        .wow-city-hero__img{width:100%;height:210px;object-fit:cover;display:block}
        .wow-compat-badge{position:absolute;bottom:12px;left:12px;color:#fff;font-size:.88rem;font-weight:700;padding:8px 16px;border-radius:50px}
        .wow-badge-orange{display:inline-block;background:#FFF3E0;color:#F57C00;font-size:.78rem;font-weight:700;padding:4px 14px;border-radius:50px;margin-top:6px}
        .wow-accent-list{font-size:.85rem;color:#3b6bdc;padding-left:18px;margin:6px 0 0;line-height:2;list-style:disc}
        .wow-budget-line{font-size:.88rem;font-weight:600;color:#1a2433;margin:4px 0}
        .wow-budget-check{font-size:.84rem;font-weight:600;margin-bottom:8px}
        .wow-insight-box{font-size:.8rem;color:#6c778a;line-height:1.5;background:#f7f9fc;border-radius:10px;padding:12px;margin-top:6px}
        .wow-cta{width:100%;background:#f07a30;color:#fff;border:none;border-radius:50px;padding:16px 24px;font-size:1.02rem;font-weight:700;cursor:pointer;transition:background .2s;margin-top:6px}
        .wow-cta:hover{background:#d96a20}
        .wow-cta-sub{text-align:center;font-size:.78rem;color:#6c778a;margin-top:8px}
        .wow-compare-cities{display:flex;gap:12px;margin-bottom:12px}
        .wow-compare-img{flex:1;height:140px;object-fit:cover;border-radius:14px}
        .wow-compare-table{background:#fff;border:1px solid #e8ecf4;border-radius:14px;overflow:hidden;margin-bottom:14px}
        .wow-compare-hdr{display:grid;grid-template-columns:1.2fr 1fr 1fr;background:#f3f6fb;padding:11px 16px}
        .wow-compare-hdr__city{font-size:.82rem;font-weight:700;text-align:center}
        .wow-compare-row{display:grid;grid-template-columns:1.2fr 1fr 1fr;padding:9px 16px;border-top:1px solid #f0f3fa;align-items:center}
        .wow-compare-row__label{font-size:.8rem;font-weight:600}
        .wow-compare-row__val{font-size:.8rem;text-align:center;color:#6c778a}
        .wow-compare-row__val--win{color:#22a55f;font-weight:600}
        .wow-winner-city{font-size:1.35rem;font-weight:900;margin-bottom:10px}
        .wow-economy-row{display:flex;justify-content:space-around;margin:10px 0}
        .wow-economy-col{text-align:center}
        .wow-economy-price{font-size:1.3rem;font-weight:800;margin:2px 0 0}
        .wow-unsure-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .wow-city-card{background:#fff;border:1px solid #e8ecf4;border-radius:16px;overflow:hidden;position:relative;transition:box-shadow .2s}
        .wow-city-card:hover{box-shadow:0 6px 24px rgba(59,107,220,.1)}
        .wow-city-card--top{border-color:#3b6bdc;box-shadow:0 4px 20px rgba(59,107,220,.12)}
        .wow-city-rank{position:absolute;background:#3b6bdc;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;margin:12px;z-index:1}
        .wow-city-card__img{width:100%;height:155px;object-fit:cover}
        .wow-city-card__body{padding:16px}
        .wow-score-bar{height:8px;background:#e4e9f2;border-radius:50px;margin:8px 0;overflow:hidden}
        .wow-score-fill{height:100%;background:#3b6bdc;border-radius:50px}
        @media(max-width:960px){
          .wow-grid--3,.wow-grid--3c{grid-template-columns:1fr}
          .wow-unsure-grid{grid-template-columns:1fr}
          .wow-compare-cities{flex-direction:column}
        }
      `}</style>
    </div>
  );
}
