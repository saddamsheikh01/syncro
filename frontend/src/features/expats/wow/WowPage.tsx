"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useMemo, useState, type CSSProperties } from "react";
import RadarChart from "./RadarChart";
import { useAuth } from "../../../hooks";
import { useT } from "@/hooks";
import { useExpats } from "../../../hooks/expats/useExpats";
import { expatsActions, expatsStore } from "../../../stores/expats/expatsStore";
import { expatsModeActions } from "../../../stores/expatsMode/expatsModeStore";
import {
  compareCities,
  getCities,
  getCityById,
  getFunnelConfig,
} from "../../../services/expats";
import type {
  CityScoreResponse,
  MacroareeScores,
  CityComparisonResponse,
  CityDetail,
} from "../../../types/expats";

const IMG = "/images/WOW-Page";

/** Stable UTF-8 punctuation (file was saved with mojibake before) */
const EM = "\u2014";
const ELL = "\u2026";
const MID = "\u00b7";
const ARR = "\u2192";
const CHECK = "\u2713";

function cityBannerHue(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % 360;
  return h;
}

/** No hardcoded Milan/Valencia photos — shows the user’s actual origin/destination label */
function CityPlaceBanner({
  label,
  className = "",
  height = 140,
  style,
}: {
  label: string;
  className?: string;
  height?: number;
  style?: CSSProperties;
}) {
  const hue = useMemo(() => cityBannerHue(label), [label]);
  const h2 = (hue + 52) % 360;
  return (
    <div
      className={className}
      style={{
        minHeight: height,
        flex: 1,
        borderRadius: 14,
        background: `linear-gradient(145deg, hsl(${hue}, 44%, 90%) 0%, hsl(${h2}, 40%, 80%) 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 16,
        fontWeight: 800,
        fontSize: "clamp(0.85rem, 2.2vw, 1.05rem)",
        color: "#0d1b36",
        lineHeight: 1.35,
        border: "1px solid #e0e6f0",
        ...style,
      }}
    >
      {label}
    </div>
  );
}

function resolveCityOrCountryId(
  label: string,
  cities: { id: string; cityName: string; country: string; citySlug?: string }[]
): string | undefined {
  const n = label.trim().toLowerCase();
  if (!n) return undefined;
  const byCity = cities.find(
    (c) =>
      c.cityName.toLowerCase() === n ||
      (c.citySlug && c.citySlug.toLowerCase() === n.replace(/\s+/g, "-"))
  );
  if (byCity) return byCity.id;
  const countryMatch = cities.filter((c) => c.country.toLowerCase() === n);
  if (countryMatch.length) return countryMatch[0].id;
  return cities.find(
    (c) =>
      c.country.toLowerCase().includes(n) ||
      n.includes(c.country.toLowerCase())
  )?.id;
}

const MACROAREA_LABELS: Record<keyof MacroareeScores, { label: string; short: string }> = {
  costo_vita: { label: "Cost Of Living", short: "Cost\nOf Living" },
  potere_economico: { label: "Economic Power", short: "Economic\nPower" },
  qualita_vita: { label: "Quality Of Life", short: "Quality\nOf Life" },
  mercato_immobiliare: { label: "Housing Market", short: "Housing\nMarket" },
  integrazione_sociale: { label: "Social Integration", short: "Social\nIntegration" },
  opportunita_lavorative: { label: "Work Opportunities", short: "Work\nOpportunities" },
};

/** Display label for API macroarea key (underscores to spaces). */
function macroareaLabelFromApi(macroarea: string): string {
  return macroarea.replace(/_/g, " ");
}

/** Short band for table (numeric macro score 0–100) */
function macroScoreBand(score: number): string {
  const n = Number(score);
  if (n >= 72) return "Strong";
  if (n >= 55) return "Moderate";
  return "Developing";
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

/** Life Impact Overview lines (macro index comparison, user-facing). */
function lifeImpactOverviewLines(rows: { macroarea: string; direction: string; delta: number }[]): string[] {
  const order = [
    "costo_vita",
    "qualita_vita",
    "integrazione_sociale",
    "opportunita_lavorative",
    "potere_economico",
    "mercato_immobiliare",
  ];
  const byMacro = new Map(rows.map((r) => [r.macroarea, r]));
  const out: string[] = [];
  for (const key of order) {
    const r = byMacro.get(key);
    if (!r || r.direction === "neutral") continue;
    const ad = Math.abs(Number(r.delta)) < 5 ? "" : Math.abs(Number(r.delta)) < 12 ? "slightly " : "";
    if (key === "costo_vita") {
      out.push(r.direction === "improvement" ? `Cost of living ↓ ${ad}lower` : `Cost of living ↑ ${ad}higher`);
    } else if (key === "qualita_vita") {
      out.push(r.direction === "improvement" ? `Quality of life ↑ ${ad}higher` : `Quality of life ↓ ${ad}lower`);
    } else if (key === "integrazione_sociale") {
      out.push(r.direction === "improvement" ? `Social integration ↑ ${ad}easier` : `Social integration ↓ ${ad}harder`);
    } else if (key === "opportunita_lavorative") {
      out.push(r.direction === "improvement" ? `Career opportunities ↑ ${ad}stronger` : `Career opportunities ↓ ${ad}lower`);
    } else if (key === "potere_economico") {
      out.push(r.direction === "improvement" ? `Economic power ↑ ${ad}stronger` : `Economic power ↓ ${ad}weaker`);
    } else if (key === "mercato_immobiliare") {
      out.push(r.direction === "improvement" ? `Housing market ↑ ${ad}easier` : `Housing market ↓ ${ad}tighter`);
    }
  }
  return out;
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
  if (marginStatusOrClassification === "unsustainable")
    return { text: `Over budget ${EM} adjustments needed`, color: "#e05555" };
  return { text: `Over budget ${EM} adjustments needed`, color: "#e05555" };
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

/** For WOW moving page: 2 strengths + 1 friction from backend insights.insights array. */
function getMovingInsights(score: CityScoreResponse | null): { strengths: string[]; friction: string | null } {
  const list =
    score?.insights &&
    typeof score.insights === "object" &&
    "insights" in score.insights &&
    Array.isArray((score.insights as { insights: { type?: string; message?: string }[] }).insights)
      ? (score.insights as { insights: { type?: string; message?: string }[] }).insights
      : [];
  const strengths: string[] = [];
  let friction: string | null = null;
  for (const item of list) {
    const msg = item?.message;
    if (typeof msg !== "string") continue;
    if (item.type === "strength" || item.type === "bonus") {
      if (strengths.length < 2) strengths.push(msg);
    } else if (item.type === "friction" && !friction) {
      friction = msg;
    }
  }
  return { strengths, friction };
}

/** Relocation Readiness: Housing difficulty (higher = worse), Economic sustainability (higher = better), Social integration (higher = better). */
function relocationReadinessFromScore(score: CityScoreResponse | null): {
  housingDifficulty: number;
  housingBand: "Easy" | "Medium" | "Difficult";
  economicValue: number;
  economicBand: "Unstable" | "Manageable" | "Stable";
  socialValue: number;
  socialBand: "Difficult" | "Medium" | "Easy";
} {
  const rv = score?.radarValues ?? {};
  const mercato = Math.round(Number((rv as MacroareeScores).mercato_immobiliare) || 0);
  const housingDifficulty = Math.min(100, Math.max(0, 100 - mercato)); // macro is "ease", so difficulty = 100 - ease
  const housingBand: "Easy" | "Medium" | "Difficult" =
    housingDifficulty <= 40 ? "Easy" : housingDifficulty <= 70 ? "Medium" : "Difficult";

  const marginStatus = score?.budgetCheck?.marginStatus ?? score?.budgetCheck?.classification;
  const economicValue =
    marginStatus === "sustainable" ? 80 : marginStatus === "tight" || marginStatus === "very_tight" ? 55 : 25;
  const economicBand: "Unstable" | "Manageable" | "Stable" =
    economicValue <= 40 ? "Unstable" : economicValue <= 70 ? "Manageable" : "Stable";

  const socialValue = Math.round(Number((rv as MacroareeScores).integrazione_sociale) || 0);
  const socialBand: "Difficult" | "Medium" | "Easy" =
    socialValue <= 40 ? "Difficult" : socialValue <= 70 ? "Medium" : "Easy";

  return { housingDifficulty, housingBand, economicValue, economicBand, socialValue, socialBand };
}

/** Relocation Readiness Score block (all targets except already-in-city). */
function RelocationReadinessBlock({ score }: { score: CityScoreResponse | null }) {
  const { t } = useT();
  const r = relocationReadinessFromScore(score);
  const housingLabel =
    r.housingBand === "Easy"
      ? t("Expats.wow.readinessEasy")
      : r.housingBand === "Medium"
        ? t("Expats.wow.readinessMedium")
        : t("Expats.wow.readinessDifficult");
  const economicLabel =
    r.economicBand === "Stable"
      ? t("Expats.wow.readinessStable")
      : r.economicBand === "Manageable"
        ? t("Expats.wow.readinessManageable")
        : t("Expats.wow.readinessUnstable");
  const socialLabel =
    r.socialBand === "Easy"
      ? t("Expats.wow.readinessEasy")
      : r.socialBand === "Medium"
        ? t("Expats.wow.readinessMedium")
        : t("Expats.wow.readinessDifficult");
  return (
    <div className="wow-card">
      <h2 className="wow-section-title" style={{ marginTop: 0 }}>{t("Expats.wow.relocationReadiness")}</h2>
      <div className="wow-readiness-row">
        <span className="wow-readiness-label">{t("Expats.wow.housingSearchDifficulty")}</span>
        <span className="wow-readiness-value">{r.housingDifficulty}</span>
        <span className="wow-readiness-band">{housingLabel}</span>
      </div>
      <div className="wow-readiness-row">
        <span className="wow-readiness-label">{t("Expats.wow.economicSustainability")}</span>
        <span className="wow-readiness-value">{r.economicValue}</span>
        <span className="wow-readiness-band">{economicLabel}</span>
      </div>
      <div className="wow-readiness-row">
        <span className="wow-readiness-label">{t("Expats.wow.socialIntegration")}</span>
        <span className="wow-readiness-value">{r.socialValue}</span>
        <span className="wow-readiness-band">{socialLabel}</span>
      </div>
    </div>
  );
}

// --- WowPlanningMove ---

function WowPlanningMove({
  cityName,
  score,
  funnelBudget: _funnelBudget,
  completionPercent,
  districts,
  structuralTitleFromConfig,
  nextActionDescription,
  onCtaClick,
}: {
  cityName: string;
  score: CityScoreResponse | null;
  funnelBudget: number | null;
  completionPercent: number | null;
  districts: { name: string; description?: string }[];
  structuralTitleFromConfig?: string | null;
  nextActionDescription?: string | null;
  onCtaClick?: () => void;
}) {
  const router = useRouter();
  const { t } = useT();
  const handleCta = onCtaClick ?? (() => router.push("/register?from=expats"));
  const totalScore = score?.scoreTotal ?? 0;
  const compat = compatLabel(score?.compatibilityLevel, totalScore);
  const radar = radarFromScore(score);
  const rawBudget = score?.budgetCheck;
  const hasBudget = rawBudget && (rawBudget.estimatedCityCost != null || rawBudget.estimatedCost != null);
  const estimatedCost = hasBudget ? rawBudget.estimatedCityCost ?? rawBudget.estimatedCost ?? 0 : 0;
  const declaredBudget = rawBudget?.declaredBudget != null ? Number(rawBudget.declaredBudget) : null;
  const margin = declaredBudget != null && estimatedCost > 0 ? declaredBudget - estimatedCost : null;
  const budgetLabel = hasBudget && rawBudget ? budgetClassLabel(rawBudget.marginStatus ?? rawBudget.classification) : null;
  const movingInsights = getMovingInsights(score);
  const profilePct = completionPercent != null ? Math.min(100, Math.max(0, completionPercent)) : null;
  const cityFitDisplay = totalScore > 0 ? totalScore : null;
  const structural = structuralBulletsFromApi(score);
  const districtNames = districts.slice(0, 5).map((d) => d.name);
  const structuralCardTitle =
    structuralTitleFromConfig ||
    (score?.rankingPosition != null ? `Match rank #${score.rankingPosition}` : null) ||
    nextActionDescription ||
    (structural.length > 0 ? movingInsights.strengths[0] : null);

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">
          {t("Expats.wow.titleChosenCity", { city: cityName })}
        </h1>
        <p className="wow-sub">
          {t("Expats.wow.subtitleChosenCity", { city: cityName })}
        </p>
      </div>

      <div className="wow-grid wow-grid--3">
        <div className="wow-col">
          <div className="wow-card wow-card--row">
            <img src={`${IMG}/image%202308.png`} alt="Zyra" className="wow-avatar" />
            <div>
              <p className="wow-bold">{t("Expats.wow.zyraHello")}</p>
              <p className="wow-muted-sm">{t("Expats.wow.zyraMentor")}</p>
            </div>
          </div>

          <h2 className="wow-section-title" style={{ marginTop: 0 }}>{t("Expats.wow.sectionCityCompatibility")}</h2>
          <div className="wow-card">
            <div className="wow-card--row" style={{ marginBottom: 12 }}>
              <img src={`${IMG}/image%202441.png`} alt="" className="wow-icon-40" />
              <div>
                <p className="wow-muted-sm" style={{ fontWeight: 700, color: "#0d1b36" }}>{t("Expats.wow.profileCityFit")}</p>
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
                    EM
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
          <div className="wow-city-hero">
            <CityPlaceBanner label={cityName || "Your city"} height={210} className="wow-city-hero__img" />
            <span className="wow-compat-badge" style={{ background: compat.color }}>
              {totalScore > 0 ? `${totalScore}% ${compat.text}` : `Score loading${ELL}`}
            </span>
          </div>

          <h2 className="wow-section-title">{t("Expats.wow.sectionCityIndexSnapshot")}</h2>
          <div className="wow-card wow-card--center">
            <p className="wow-muted-sm" style={{ marginBottom: 12 }}>
              {t("Expats.wow.costOfLivingLabel")}, {t("Expats.wow.housingMarket")}, {t("Expats.wow.economicPower")}, {t("Expats.wow.qualityOfLife")}, {t("Expats.wow.workOpportunities")}, {t("Expats.wow.socialIntegration")}
            </p>
            <RadarChart data={radar} size={240} color="#3b6bdc" />
          </div>

          <h2 className="wow-section-title">{t("Expats.wow.sectionEstimatedRealCost")}</h2>
          <div className="wow-card wow-card--center">
            <p className="wow-muted-sm" style={{ marginBottom: 6 }}>{t("Expats.wow.estimatedCostFormula")}</p>
            {estimatedCost > 0 && (
              <p className="wow-bold" style={{ marginBottom: 4 }}>{formatEur(estimatedCost)}/mo</p>
            )}
            {declaredBudget != null && margin != null && (
              <p className="wow-muted-sm">
                {t("Expats.wow.marginLabel")}: {formatEur(margin)}
              </p>
            )}
            {budgetLabel && (
              <p className="wow-budget-check" style={{ color: budgetLabel.color, marginTop: 8 }}>
                {CHECK} {budgetLabel.text}
              </p>
            )}
          </div>

          <h2 className="wow-section-title">{t("Expats.wow.sectionAutomaticInsights")}</h2>
          <div className="wow-card">
            <ul className="wow-accent-list">
              {movingInsights.strengths.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
              {movingInsights.friction && (
                <li style={{ color: "#b45309" }}>{movingInsights.friction}</li>
              )}
            </ul>
            {movingInsights.strengths.length === 0 && !movingInsights.friction && (
              <p className="wow-muted-sm">{nextActionDescription || "Insights appear after scoring completes."}</p>
            )}
          </div>

          <h2 className="wow-section-title">{t("Expats.wow.sectionNetworkPreview")}</h2>
          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 8 }}>{t("Expats.wow.connectLocals")}</p>
            <ul className="wow-accent-list">
              <li>{t("Expats.wow.networkSimilarExpats")}</li>
              <li>{t("Expats.wow.networkMentors")}</li>
              <li>{t("Expats.wow.networkProfessionals")}</li>
            </ul>
            <img src={`${IMG}/Group%201686559670.png`} alt="Mentors" className="wow-mentors-row" style={{ marginTop: 12 }} />
          </div>

          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 8 }}>{t("Expats.wow.fullAnalysisIncludes")}</p>
            <img src={`${IMG}/image%202436.png`} alt="Neighbourhoods" className="wow-img-160" style={{ margin: "8px auto" }} />
            <p className="wow-muted-sm">{t("Expats.wow.neighbourhoodsDataset")}</p>
            {districtNames.length > 0 ? (
              <ul className="wow-accent-list">
                {districtNames.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="wow-muted-sm">{t("Expats.wow.districtLoads")}</p>
            )}
          </div>

          <RelocationReadinessBlock score={score} />

          <button type="button" onClick={handleCta} className="wow-cta">
            {t("Expats.wow.seeFullAnalysis")}
          </button>
          <p className="wow-cta-sub">{t("Expats.wow.ctaSub")}</p>
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
            <p className="wow-bold">{t("Expats.wow.financialComfort")}</p>
            <p className="wow-muted-sm">{t("Expats.wow.estimatedMonthly")}</p>
            {estimatedCost > 0 && budgetLabel ? (
              <>
                <p className="wow-budget-line">{formatEur(estimatedCost)} estimated monthly need (dataset + your lifestyle inputs)</p>
                <p className="wow-budget-check" style={{ color: budgetLabel.color }}>
                  {CHECK} {budgetLabel.text}
                </p>
              </>
            ) : (
              <p className="wow-muted-sm">{t("Expats.wow.budgetCheckHint")}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// --- WowAlreadyThere ---

function WowAlreadyThere({
  cityName,
  score,
  completionPercent,
  districts,
  structuralTitleFromConfig,
  nextActionDescription,
  onCtaClick,
}: {
  cityName: string;
  score: CityScoreResponse | null;
  completionPercent: number | null;
  districts: { name: string }[];
  structuralTitleFromConfig?: string | null;
  nextActionDescription?: string | null;
  onCtaClick?: () => void;
}) {
  const router = useRouter();
  const { t } = useT();
  const handleCta = onCtaClick ?? (() => router.push("/register?from=expats"));
  const radar = radarFromScore(score);
  const rawBudget = score?.budgetCheck;
  const estimatedCost = rawBudget ? rawBudget.estimatedCityCost ?? rawBudget.estimatedCost ?? 0 : 0;
  const budgetLabel = rawBudget ? budgetClassLabel(rawBudget?.marginStatus ?? rawBudget?.classification) : null;
  const structural = structuralBulletsFromApi(score);
  const districtNames = districts.slice(0, 5).map((d) => d.name);
  const profilePct = completionPercent != null ? Math.min(100, Math.max(0, completionPercent)) : null;

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">{t("Expats.wow.titleAlreadyThere", { city: cityName })}</h1>
        <p className="wow-sub">{t("Expats.wow.subtitleAlreadyThere", { city: cityName })}</p>
      </div>
      <div className="wow-grid wow-grid--3">
        <div className="wow-col">
          <div className="wow-card wow-card--row">
            <img src={`${IMG}/image%202308.png`} alt="Zyra" className="wow-avatar" />
            <div>
              <p className="wow-bold">{t("Expats.wow.zyraHello")}</p>
              <p className="wow-muted-sm">{t("Expats.wow.zyraMentor")}</p>
            </div>
          </div>
          <div className="wow-card">
            {profilePct != null && <p className="wow-muted-sm">{t("Expats.wow.profileCompletion", { pct: profilePct })}</p>}
            {score?.compatibilityLevel && (
              <p className="wow-body-text">{t("Expats.wow.compatibilityLevel", { level: score.compatibilityLevel.replace(/_/g, " ") })}</p>
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
            <h2 className="wow-section-title">{t("Expats.wow.alignmentMap", { city: cityName })}</h2>
            <img src={`${IMG}/image%202430.png`} alt="" className="wow-img-100" />
            <p className="wow-muted-sm" style={{ textAlign: "center", lineHeight: 1.6 }}>
              Macro-area scores from your latest run (radar below).
            </p>
          </div>
          <div className="wow-card">
            <h2 className="wow-section-title" style={{ marginTop: 0 }}>{t("Expats.wow.sectionCityExperiencePotential")}</h2>
            <p className="wow-muted-sm">{t("Expats.wow.cityExperiencePotentialCopy", { city: cityName })}</p>
          </div>
          <div className="wow-card">
            <p className="wow-bold">{t("Expats.wow.neighbourhoodsExplore")}</p>
            {districtNames.length > 0 ? (
              <ul className="wow-accent-list">
                {districtNames.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="wow-muted-sm">{t("Expats.wow.loadingDistricts")}</p>
            )}
          </div>
          <button type="button" onClick={handleCta} className="wow-cta">
            {t("Expats.wow.ctaAlreadyThere", { city: cityName })} {ARR}
          </button>
          <p className="wow-cta-sub">{t("Expats.wow.previewUnlocked")}</p>
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
            <p className="wow-bold">{t("Expats.wow.financialComfort")}</p>
            {estimatedCost > 0 && budgetLabel ? (
              <>
                <p className="wow-budget-line">{formatEur(estimatedCost)} estimated monthly need</p>
                <p className="wow-budget-check" style={{ color: budgetLabel.color }}>
                  {CHECK} {budgetLabel.text}
                </p>
              </>
            ) : (
              <p className="wow-muted-sm">{t("Expats.wow.financialBreakdown")}</p>
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

// --- WowComparison ---

function WowComparison({
  comparison,
  currentCityName,
  targetCityName,
  targetScore,
  currentDistricts,
  targetDistricts,
  onCtaClick,
}: {
  comparison: CityComparisonResponse | null;
  currentCityName: string;
  targetCityName: string;
  targetScore: CityScoreResponse | null;
  currentDistricts: { name: string }[];
  targetDistricts: { name: string }[];
  onCtaClick?: () => void;
}) {
  const router = useRouter();
  const { t } = useT();
  const handleCta = onCtaClick ?? (() => router.push("/register?from=expats"));
  const radar = radarFromScore(targetScore);
  const cur = comparison?.currentCity?.name ?? currentCityName;
  const tgt = comparison?.targetCity?.name ?? targetCityName;
  const macroRows = comparison?.macroareeComparison ?? [];
  const econ = comparison?.economicImpact;
  const tradeBullets = comparison?.tradeOffs?.slice(0, 4) ?? [];
  const winnerSummary = comparison?.overallImpact?.summary ?? comparison?.priorityAlignment?.summary;
  const aligned = comparison?.priorityAlignment?.alignedPriorities ?? [];
  const oi = comparison?.overallImpact;
  const structuralFocus = useMemo(() => structuralBulletsFromApi(targetScore), [targetScore]);

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">
          {t("Expats.wow.title", { cur, tgt })}
        </h1>
        <p className="wow-sub">
          {comparison ? (
            <>
              {t("Expats.wow.subtitleComparison")}
              {winnerSummary || comparison.priorityAlignment?.summary ? (
                <span style={{ display: "block", marginTop: 8 }}>
                  {winnerSummary || comparison.priorityAlignment?.summary}
                </span>
              ) : null}
            </>
          ) : (
            winnerSummary ||
            (targetScore?.insights && typeof targetScore.insights === "object" && "suggestions" in targetScore.insights
              ? (targetScore.insights as { suggestions?: string[] }).suggestions?.[0]
              : null) ||
            `Comparing ${cur} and ${tgt} from your profile and city dataset.`
          )}
        </p>
        {!comparison && (
          <p className="wow-muted-sm" style={{ marginTop: 8 }}>
            {cur && tgt
              ? "We couldn’t load a comparison for these places yet. Make sure both match a city or country in our catalog, or complete your profile and try again."
              : `Resolving both places against our city catalog${ELL} scores and macro comparison load when both match a city or country in the dataset.`}
          </p>
        )}
      </div>

      {comparison && macroRows.length > 0 && (
        <div className="wow-life-impact wow-card" style={{ marginBottom: 24 }}>
          <h2 className="wow-section-title" style={{ marginTop: 0 }}>
            {t("Expats.wow.lifeImpactOverview")}
          </h2>
          <p className="wow-body-text" style={{ fontWeight: 700, marginBottom: 12 }}>
            {t("Expats.wow.movingFromTo", { cur, tgt })}
          </p>
          <ul className="wow-life-impact-list">
            {lifeImpactOverviewLines(macroRows).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="wow-grid wow-grid--3c">
        <div className="wow-col">
          <div className="wow-card wow-card--center">
            <p className="wow-bold-sm" style={{ marginBottom: 10, color: "#3b6bdc" }}>
              {t("Expats.wow.betterMatchForProfile")}
            </p>
            {comparison?.overallImpact?.compatibilityLevelTarget && (
              <p className="wow-muted-sm" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, fontStyle: "italic" }}>
                Target fit: {comparison.overallImpact.compatibilityLevelTarget.replace(/_/g, " ")}
              </p>
            )}
            <img src={`${IMG}/image%202425.png`} alt="" className="wow-img-60" aria-hidden />
            <h2 className="wow-winner-city">{tgt.toUpperCase()}</h2>
            {oi != null && (oi.scoreCurrentCity > 0 || oi.scoreTargetCity > 0) && (
              <p className="wow-muted-sm" style={{ marginBottom: 10 }}>
                <strong>{cur}</strong> fit {oi.scoreCurrentCity}/100
                {oi.compatibilityLevelCurrent ? ` (${oi.compatibilityLevelCurrent.replace(/_/g, " ")})` : ""} {MID}{" "}
                <strong>{tgt}</strong> fit {oi.scoreTargetCity}/100
                {oi.compatibilityLevelTarget ? ` (${oi.compatibilityLevelTarget.replace(/_/g, " ")})` : ""}
              </p>
            )}
            {aligned.length > 0 && (
              <p className="wow-muted-sm" style={{ marginBottom: 8 }}>
                Your priorities aligned: {aligned.join(` ${MID} `)}
              </p>
            )}
            {tradeBullets.length > 0 ? (
              <ul className="wow-accent-list" style={{ textAlign: "left" }}>
                {tradeBullets.map((t) => (
                  <li key={t.macroarea}>{t.message}</li>
                ))}
              </ul>
            ) : (
              <ul className="wow-accent-list">
                <li>{comparison?.priorityAlignment?.summary || t("Expats.wow.addCitiesHint")}</li>
              </ul>
            )}
          </div>
          {structuralFocus.length > 0 && (
            <div className="wow-card">
              <p className="wow-bold-sm">{t("Expats.wow.structuralPlan90")}</p>
              <ul className="wow-accent-list">
                {structuralFocus.map((s) => (
                  <li key={s.slice(0, 40)}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="wow-card">
            <p className="wow-bold-sm" style={{ marginBottom: 8, color: "#3b6bdc" }}>
              {t("Expats.wow.fullAnalysisIncludes")}
            </p>
            <p className="wow-bold" style={{ marginBottom: 8 }}>
              {t("Expats.wow.bestNeighbourhoodsIn", { city: tgt })}
            </p>
            <CityPlaceBanner label={tgt} height={100} style={{ margin: "8px auto" }} />
            {targetDistricts.length > 0 ? (
              <ul className="wow-accent-list">
                {targetDistricts.slice(0, 5).map((d) => (
                  <li key={d.name}>{d.name}</li>
                ))}
              </ul>
            ) : (
              <p className="wow-muted-sm">{t("Expats.wow.districtsFromCatalog", { city: tgt })}</p>
            )}
          </div>
          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 8 }}>
              {cur} {EM} areas ({currentDistricts.length || ELL})
            </p>
            <CityPlaceBanner label={cur} height={100} style={{ margin: "8px auto" }} />
            {currentDistricts.length > 0 ? (
              <ul className="wow-accent-list">
                {currentDistricts.slice(0, 5).map((d) => (
                  <li key={d.name}>{d.name}</li>
                ))}
              </ul>
            ) : (
              <p className="wow-muted-sm">{t("Expats.wow.districtsFromCatalog", { city: cur })}</p>
            )}
          </div>
        </div>

        <div className="wow-col">
          <div className="wow-compare-cities">
            <CityPlaceBanner label={cur} height={140} className="wow-compare-img" />
            <CityPlaceBanner label={tgt} height={140} className="wow-compare-img" />
          </div>
          {macroRows.length > 0 ? (
            <div className="wow-compare-table wow-compare-table--4">
              <p className="wow-bold-sm" style={{ padding: "12px 16px 0", margin: 0 }}>
                {t("Expats.wow.cityIndexComparison")}
              </p>
              <div className="wow-compare-hdr wow-compare-hdr--4">
                <div className="wow-compare-hdr__driver">{t("Expats.wow.driver")}</div>
                <div className="wow-compare-hdr__city">{cur.toUpperCase()}</div>
                <div className="wow-compare-hdr__city">{tgt.toUpperCase()}</div>
                <div className="wow-compare-hdr__delta">Δ</div>
              </div>
              {macroRows.map((r) => {
                const label = macroareaLabelFromApi(String(r.macroarea));
                const csc = Number(r.currentCityScore);
                const tsc = Number(r.targetCityScore);
                const delta = Math.round(tsc - csc);
                const deltaCls =
                  delta > 0 ? "wow-delta--up" : delta < 0 ? "wow-delta--down" : "wow-delta--flat";
                return (
                  <div key={r.macroarea} className="wow-compare-row wow-compare-row--4">
                    <div className="wow-compare-row__label">{label}</div>
                    <div className="wow-compare-row__val">
                      <strong>{csc.toFixed(0)}</strong>
                    </div>
                    <div className="wow-compare-row__val">
                      <strong>{tsc.toFixed(0)}</strong>
                    </div>
                    <div className={`wow-compare-row__delta ${deltaCls}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="wow-card">
              <p className="wow-muted-sm">
                {comparison?.priorityAlignment?.summary || t("Expats.wow.macroScoresHint")}
              </p>
            </div>
          )}
          {comparison?.userPriorityClassification &&
            Object.keys(comparison.userPriorityClassification).length > 0 && (
              <div className="wow-card">
                <p className="wow-bold-sm">{t("Expats.wow.yourPriorityFocus")}</p>
                <p className="wow-muted-sm">
                  {Object.entries(comparison.userPriorityClassification)
                    .slice(0, 6)
                    .map(([k, v]) => `${macroareaLabelFromApi(k)}: ${v}`)
                    .join(` ${MID} `)}
                </p>
              </div>
            )}
          {comparison?.algorithmVersion ? (
            <p className="wow-cta-sub" style={{ marginTop: 4 }}>
              Comparison algorithm: {comparison.algorithmVersion}
            </p>
          ) : null}
          {econ && (
            <div className="wow-card">
              <p className="wow-bold-sm" style={{ marginBottom: 12 }}>
                {t("Expats.wow.economicImpact")}
              </p>
              <p className="wow-muted-sm" style={{ marginBottom: 14 }}>
                {t("Expats.wow.estimatedMonthlyTotal", { type: econ.isFamily ? t("Expats.wow.family") : t("Expats.wow.single") })}
              </p>
              <div className="wow-econ-split">
                <div className="wow-econ-city">
                  <p className="wow-bold" style={{ marginBottom: 8 }}>{cur}</p>
                  {econ.currentLivingExRent != null && econ.currentRentHousing != null ? (
                    <>
                      <p className="wow-muted-sm">
                        {econ.isFamily ? "Family" : "Single"} cost of living (excl. rent):{" "}
                        <strong>{formatEur(Number(econ.currentLivingExRent))}</strong>
                      </p>
                      <p className="wow-muted-sm">
                        Average {econ.isFamily ? "3BR" : "1BR"} rent:{" "}
                        <strong>{formatEur(Number(econ.currentRentHousing))}</strong>
                      </p>
                    </>
                  ) : null}
                  <p className="wow-econ-total">
                    Total: <strong>{formatEur(Number(econ.currentCityCost))}</strong>/mo
                  </p>
                </div>
                <div className="wow-econ-city">
                  <p className="wow-bold" style={{ marginBottom: 8 }}>{tgt}</p>
                  {econ.targetLivingExRent != null && econ.targetRentHousing != null ? (
                    <>
                      <p className="wow-muted-sm">
                        {econ.isFamily ? "Family" : "Single"} cost of living (excl. rent):{" "}
                        <strong>{formatEur(Number(econ.targetLivingExRent))}</strong>
                      </p>
                      <p className="wow-muted-sm">
                        Average {econ.isFamily ? "3BR" : "1BR"} rent:{" "}
                        <strong>{formatEur(Number(econ.targetRentHousing))}</strong>
                      </p>
                    </>
                  ) : null}
                  <p className="wow-econ-total">
                    Total: <strong>{formatEur(Number(econ.targetCityCost))}</strong>/mo
                  </p>
                </div>
              </div>
              <p className="wow-body-text" style={{ marginTop: 14, fontWeight: 600 }}>
                {econ.summary}
              </p>
              {econ.monthlySaving !== 0 && (
                <p className="wow-muted-sm" style={{ marginTop: 8 }}>
                  Monthly difference:{" "}
                  <strong style={{ color: econ.monthlySaving > 0 ? "#22a55f" : "#e05555" }}>
                    {econ.monthlySaving > 0 ? "−" : "+"}
                    {formatEur(Math.abs(econ.monthlySaving))}/mo
                  </strong>
                  {" · "}
                  Annual:{" "}
                  <strong style={{ color: econ.monthlySaving > 0 ? "#22a55f" : "#e05555" }}>
                    {econ.monthlySaving > 0 ? "−" : "+"}
                    {formatEur(Math.abs(econ.monthlySaving * 12))}/yr
                  </strong>
                </p>
              )}
            </div>
          )}
          {comparison?.priorityAlignment?.summary && (
            <div className="wow-card">
              <p className="wow-bold-sm" style={{ marginBottom: 8 }}>
                {t("Expats.wow.impactOnProfile")}
              </p>
              <p className="wow-body-text">{comparison.priorityAlignment.summary}</p>
              {aligned.length > 0 && (
                <p className="wow-muted-sm" style={{ marginTop: 8 }}>
                  Aligned macro-areas:{" "}
                  {aligned.map((k) => (MACROAREA_LABELS as Record<string, { label: string }>)[k]?.label ?? k).join(", ")}
                </p>
              )}
            </div>
          )}
          {tradeBullets.length > 0 && (
            <div className="wow-card wow-card--tradeoff">
              <p className="wow-bold-sm" style={{ marginBottom: 8 }}>
                {t("Expats.wow.tradeOff")}
              </p>
              <p className="wow-body-text" style={{ fontWeight: 600, marginBottom: 8 }}>
                {tradeBullets[0].message}
              </p>
              {tradeBullets.length > 1 && (
                <ul className="wow-accent-list" style={{ textAlign: "left", marginTop: 8 }}>
                  {tradeBullets.slice(1).map((t) => (
                    <li key={t.macroarea}>{t.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {oi?.summary && (
            <div className="wow-card">
              <p className="wow-bold-sm" style={{ marginBottom: 8 }}>
                {t("Expats.wow.overallImpact")}
              </p>
              <p className="wow-body-text">{oi.summary}</p>
            </div>
          )}
          {(() => {
            const declines = macroRows.filter((r) => r.direction === "decline");
            const improvements = macroRows.filter((r) => r.direction === "improvement");
            if (declines.length === 0 && improvements.length === 0) return null;
            const toLabel = (macroarea: string) =>
              (MACROAREA_LABELS as Record<string, { label: string }>)[macroarea]?.label ?? macroareaLabelFromApi(macroarea);
            return (
              <div className="wow-card wow-daily-life">
                <p className="wow-bold-sm" style={{ marginBottom: 10 }}>{t("Expats.wow.dailyLifeDifference")}</p>
                <div className="wow-daily-life__grid">
                  <div>
                    <p className="wow-muted-sm" style={{ fontWeight: 700, marginBottom: 6 }}>{cur}</p>
                    <ul className="wow-accent-list" style={{ margin: 0, paddingLeft: 18 }}>
                      {declines.slice(0, 3).map((r) => (
                        <li key={r.macroarea}>{t("Expats.wow.strongerIn", { label: toLabel(r.macroarea) })}</li>
                      ))}
                      {declines.length === 0 && <li className="wow-muted-sm">{t("Expats.wow.compareScoresAbove")}</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="wow-muted-sm" style={{ fontWeight: 700, marginBottom: 6 }}>{tgt}</p>
                    <ul className="wow-accent-list" style={{ margin: 0, paddingLeft: 18 }}>
                      {improvements.slice(0, 3).map((r) => (
                        <li key={r.macroarea}>{t("Expats.wow.better", { label: toLabel(r.macroarea) })}</li>
                      ))}
                      {improvements.length === 0 && <li className="wow-muted-sm">{t("Expats.wow.compareScoresAbove")}</li>}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}
          {comparison ? (
            <div className="wow-cta-row">
              <button type="button" onClick={handleCta} className="wow-cta">
                {t("Expats.wow.seeFullAnalysis")}
              </button>
              <button
                type="button"
                onClick={() => router.push("/expats")}
                className="wow-cta wow-cta--secondary"
              >
                {t("Expats.wow.compareAnotherCity")}
              </button>
            </div>
          ) : (
            <button type="button" onClick={handleCta} className="wow-cta">
              {t("Expats.wow.seeFullAnalysis")}
            </button>
          )}
        </div>

        <div className="wow-col">
          <div className="wow-card wow-card--row">
            <img src={`${IMG}/image%202308.png`} alt="Zyra" className="wow-avatar" />
            <div>
              <p className="wow-bold">{t("Expats.wow.zyraHello")}</p>
              <p className="wow-muted-sm">{t("Expats.wow.zyraMentor")}</p>
            </div>
          </div>
          <div className="wow-card wow-card--center">
            <p className="wow-bold">
              {tgt} Compatibility <span className="wow-accent">Breakdown</span>
            </p>
            <RadarChart data={radar} size={200} color="#3b6bdc" />
          </div>
          <RelocationReadinessBlock score={targetScore} />
          <div className="wow-card">
            <div className="wow-card--row" style={{ marginBottom: 8 }}>
              <img src={`${IMG}/image%202441.png`} alt="" className="wow-icon-40" />
              <div>
                <p className="wow-muted-sm" style={{ fontWeight: 700, color: "#0d1b36" }}>{t("Expats.wow.compatibilityLevel", { level: comparison?.overallImpact?.compatibilityLevelTarget ?? targetScore?.compatibilityLevel?.replace(/_/g, " ") ?? EM })}</p>
                <p className="wow-big-num">
                  {comparison?.overallImpact?.scoreTargetCity ?? targetScore?.scoreTotal ?? EM}
                  {typeof (comparison?.overallImpact?.scoreTargetCity ?? targetScore?.scoreTotal) === "number" ? (
                    <span className="wow-big-num__sub">/100</span>
                  ) : null}
                </p>
              </div>
            </div>
            {oi?.summary && (
              <p className="wow-muted-sm" style={{ marginTop: 8 }}>
                {oi.summary}
              </p>
            )}
          </div>
          <div className="wow-card">
            <p className="wow-bold-sm">{t("Expats.wow.communityMentors")}</p>
            <p className="wow-muted-sm">
              Full mentor counts and compatible profiles unlock after registration {EM} this preview focuses on city data and scoring.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/** First short insight line from score (strengths, suggestions, or insights array). */
function shortInsightFromScore(score: CityScoreResponse): string | null {
  const ins = score.insights;
  if (!ins) return null;
  const first = (ins.strengths && ins.strengths[0]) ?? (ins.suggestions && ins.suggestions[0])
    ?? (Array.isArray(ins.insights) && ins.insights[0]);
  return typeof first === "string" ? first : null;
}

// --- WowUnsure ---

function WowUnsure({ scores, onCtaClick }: { scores: CityScoreResponse[] | undefined; onCtaClick?: () => void }) {
  const router = useRouter();
  const { t } = useT();
  const handleCta = onCtaClick ?? (() => router.push("/register?from=expats"));
  const TOP_CITIES = useMemo(() => {
    if (!scores?.length) return [];
    return scores.slice(0, 3).map((s, i) => {
      const cost = s.budgetCheck?.estimatedCityCost ?? s.budgetCheck?.estimatedCost;
      return {
        name: s.cityName,
        country: s.country,
        score: s.scoreTotal,
        radar: radarFromScore(s),
        estimatedCost: typeof cost === "number" ? cost : null,
        shortInsight: shortInsightFromScore(s),
        img:
          i === 0
            ? `${IMG}/Rectangle%203465253.png`
            : i === 1
              ? `${IMG}/Rectangle%203465225.png`
              : `${IMG}/Rectangle%203465253.png`,
      };
    });
  }, [scores]);

  if (TOP_CITIES.length === 0) {
    return (
      <>
        <div className="wow-header">
          <h1 className="wow-title">{t("Expats.wow.titleUnsure")}</h1>
          <p className="wow-sub">{t("Expats.wow.subtitleUnsure")}</p>
          <p className="wow-muted-sm" style={{ marginTop: 12 }}>
            Complete the funnel and run scoring to see your top compatible cities here.
          </p>
        </div>
        <button type="button" onClick={handleCta} className="wow-cta" style={{ marginTop: 32 }}>
          {t("Expats.wow.seeFullAnalysis")}
        </button>
        <p className="wow-cta-sub">{t("Expats.wow.ctaSub")}</p>
      </>
    );
  }

  const topNames = scores?.slice(0, 3).map((s) => s.cityName).filter(Boolean).join(", ") ?? "";
  const topScore = scores?.[0] ?? null;

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">{t("Expats.wow.titleUnsure")}</h1>
        <p className="wow-sub">{t("Expats.wow.subtitleUnsure")}</p>
      </div>

      {topScore && (
        <div className="wow-card" style={{ marginBottom: 24 }}>
          <h2 className="wow-section-title" style={{ marginTop: 0 }}>{t("Expats.wow.sectionCompatibilityFactor")}</h2>
          <p className="wow-muted-sm" style={{ marginBottom: 12 }}>
            {t("Expats.wow.betterMatchForProfile")}: <strong>{topScore.cityName}</strong> ({topScore.scoreTotal}% match)
          </p>
          <RelocationReadinessBlock score={topScore} />
        </div>
      )}

      <div className="wow-unsure-grid">
        {TOP_CITIES.map((city, i) => (
          <div key={`${city.name}-${i}`} className={`wow-city-card ${i === 0 ? "wow-city-card--top" : ""}`}>
            <div className="wow-city-rank">#{i + 1}</div>
            <CityPlaceBanner label={city.name} height={155} className="wow-city-card__img" style={{ borderRadius: 0, border: "none" }} />
            <div className="wow-city-card__body">
              <h3 className="wow-bold">{city.name}</h3>
              <p className="wow-muted-sm">{city.country}</p>
              <div className="wow-score-bar">
                <div className="wow-score-fill" style={{ width: `${Math.min(100, city.score)}%` }} />
              </div>
              <p className="wow-muted-sm">
                <strong>{city.score}%</strong> Compatibility
              </p>
              {city.estimatedCost != null && (
                <p className="wow-muted-sm" style={{ marginTop: 4 }}>
                  {t("Expats.wow.estimatedCostLabel")}: ~€{city.estimatedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                </p>
              )}
              {city.shortInsight && (
                <p className="wow-muted-sm" style={{ marginTop: 6, fontSize: "0.85rem", lineHeight: 1.35 }}>
                  {city.shortInsight}
                </p>
              )}
            </div>
            <div style={{ padding: "0 16px 16px", textAlign: "center" }}>
              <RadarChart data={city.radar} size={160} color="#3b6bdc" />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={handleCta} className="wow-cta" style={{ marginTop: 32 }}>
        {t("Expats.wow.seeFullAnalysis")}
      </button>
      <p className="wow-cta-sub">{scores?.length ? t("Expats.wow.showingTop3Of", { count: scores.length }) : ""}</p>
    </>
  );
}

// --- WowPage ---

export default function WowPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { funnelAnswers, scoringResult, initSession, session, onboarding, activationState } = useExpats();
  const initialized = useRef(false);
  const scoringPipeline = useRef(false);
  const handleWowCta = useCallback(() => {
    if (isAuthenticated) {
      expatsModeActions.setActive(true);
      // Sync funnel/session data to profile (e.g. existing Syncro user who just completed the test)
      expatsActions.convertAndSync().catch(() => null).finally(() => {
        router.push("/expats/activation");
      });
    } else {
      router.push("/register?from=expats");
    }
  }, [isAuthenticated, router]);
  const [districtCity, setDistrictCity] = useState<CityDetail | null>(null);
  const [comparison, setComparison] = useState<CityComparisonResponse | null>(null);
  const [comparisonTargetDistricts, setComparisonTargetDistricts] = useState<{ name: string }[]>([]);
  const [comparisonCurrentDistricts, setComparisonCurrentDistricts] = useState<{ name: string }[]>([]);
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
      const after = expatsStore.getState().scoringResult?.scores ?? [];
      if (!after.length) {
        await expatsActions.tryHydrateScoringFromHistory().catch(() => {});
      }
    })();
  }, [session]);

  /* Compare when we have two city UUIDs (onboarding) or can resolve names to catalog (use onboarding names when present). */
  useEffect(() => {
    let cancelled = false;
    const clearComparison = () => {
      queueMicrotask(() => {
        if (!cancelled) setComparison(null);
      });
    };

    const ob = onboarding;
    const curName = ((onboarding?.currentCityName?.trim() ?? "") || (funnelAnswers.currentCityName?.trim() ?? "")).trim();
    const tgtName = ((onboarding?.targetCityName?.trim() ?? "") || (funnelAnswers.targetCityName?.trim() ?? "")).trim();
    const isComparisonMode =
      funnelAnswers.targetType === "specific_city" || (Boolean(ob?.currentCityName?.trim() && ob?.targetCityName?.trim()));
    if (!isComparisonMode || !curName || !tgtName) {
      clearComparison();
      return () => {
        cancelled = true;
      };
    }

    const run = async () => {
      let currentId = ob?.currentCityId ?? undefined;
      let targetId = ob?.targetCityId ?? undefined;
      if (!currentId || !targetId) {
        try {
          const cities = await getCities();
          if (!currentId) currentId = resolveCityOrCountryId(curName, cities);
          if (!targetId) targetId = resolveCityOrCountryId(tgtName, cities);
        } catch {
          /* ignore */
        }
      }
      if (!currentId || !targetId || cancelled) {
        if (!cancelled) setComparison(null);
        return;
      }
      try {
        const c = await compareCities({ currentCityId: currentId, targetCityId: targetId });
        if (!cancelled && c && typeof c === "object" && (c.currentCity?.id || c.targetCity?.id)) {
          setComparison(c);
          if (c.targetCity?.id) expatsActions.computeScoring(c.targetCity.id).catch(() => {});
        } else if (!cancelled) {
          setComparison(null);
        }
      } catch {
        if (!cancelled) setComparison(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    onboarding?.currentCityId,
    onboarding?.targetCityId,
    onboarding?.currentCityName,
    onboarding?.targetCityName,
    funnelAnswers.targetType,
    funnelAnswers.currentCityName,
    funnelAnswers.targetCityName,
  ]);

  useEffect(() => {
    const tid = comparison?.targetCity?.id;
    let cancelled = false;
    if (!tid) {
      queueMicrotask(() => {
        if (!cancelled) setComparisonTargetDistricts([]);
      });
      return () => {
        cancelled = true;
      };
    }
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

  useEffect(() => {
    const cid = comparison?.currentCity?.id;
    let cancelled = false;
    if (!cid) {
      queueMicrotask(() => {
        if (!cancelled) setComparisonCurrentDistricts([]);
      });
      return () => {
        cancelled = true;
      };
    }
    getCityById(cid)
      .then((d) => {
        if (!cancelled) setComparisonCurrentDistricts(d.districts ?? []);
      })
      .catch(() => {
        if (!cancelled) setComparisonCurrentDistricts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [comparison?.currentCity?.id]);

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
    let cancelled = false;
    if (!id) {
      queueMicrotask(() => {
        if (!cancelled) setDistrictCity(null);
      });
      return () => {
        cancelled = true;
      };
    }
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
  /* When logged in, onboarding is source of truth for city names so the screen matches the profile (e.g. Pakistan/India). */
  const effectiveCurrent = (onboarding?.currentCityName?.trim() || funnelCurrent) || "";
  const effectiveTarget = (onboarding?.targetCityName?.trim() || funnelTarget) || "";

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
          cityName={onboarding?.currentCityName || funnelCurrent || cityDisplay || ELL}
          score={primaryScore}
          completionPercent={completionPercent}
          districts={districts}
          structuralTitleFromConfig={structuralTitleFromFunnel}
          nextActionDescription={nextActionDescription}
          onCtaClick={handleWowCta}
        />
      );
    }
    if (targetType === "not_sure") {
      return <WowUnsure scores={scoringResult?.scores} onCtaClick={handleWowCta} />;
    }
    if (targetType === "already_live") {
      return (
        <WowAlreadyThere
          cityName={onboarding?.currentCityName || funnelCurrent || cityDisplay || ELL}
          score={primaryScore}
          completionPercent={completionPercent}
          districts={districts}
          structuralTitleFromConfig={structuralTitleFromFunnel}
          nextActionDescription={nextActionDescription}
          onCtaClick={handleWowCta}
        />
      );
    }
    if (effectiveCurrent && effectiveTarget && (targetType === "specific_city" || (onboarding?.currentCityName && onboarding?.targetCityName))) {
      const tid = comparison?.targetCity?.id;
      const targetScoreForCompare =
        tid && scoringResult?.scores?.length
          ? scoringResult.scores.find((s) => s.cityId === tid) ?? primaryScore
          : primaryScore;
      return (
        <WowComparison
          comparison={comparison}
          currentCityName={comparison?.currentCity?.name ?? effectiveCurrent}
          targetCityName={comparison?.targetCity?.name ?? effectiveTarget}
          targetScore={targetScoreForCompare}
          currentDistricts={comparisonCurrentDistricts}
          targetDistricts={comparisonTargetDistricts}
          onCtaClick={handleWowCta}
        />
      );
    }
    return (
      <WowPlanningMove
        cityName={cityDisplay || ELL}
        score={primaryScore}
        funnelBudget={onboarding?.monthlyBudget ?? funnelAnswers.monthlyBudget ?? null}
        completionPercent={completionPercent}
        districts={districts}
        structuralTitleFromConfig={structuralTitleFromFunnel}
        nextActionDescription={nextActionDescription}
        onCtaClick={handleWowCta}
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
          <span className="wow-logo__sym" aria-hidden>{"\u221E"}</span>
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
        .wow-compare-hdr--4{grid-template-columns:1.25fr 0.9fr 0.9fr 0.55fr}
        .wow-compare-hdr__driver{font-size:.78rem;font-weight:700;color:#6c778a}
        .wow-compare-hdr__city{font-size:.82rem;font-weight:700;text-align:center}
        .wow-compare-hdr__delta{font-size:.78rem;font-weight:700;text-align:center;color:#6c778a}
        .wow-compare-row{display:grid;grid-template-columns:1.2fr 1fr 1fr;padding:9px 16px;border-top:1px solid #f0f3fa;align-items:center}
        .wow-compare-row--4{grid-template-columns:1.25fr 0.9fr 0.9fr 0.55fr}
        .wow-compare-row__label{font-size:.8rem;font-weight:600}
        .wow-compare-row__val{font-size:.8rem;text-align:center;color:#6c778a}
        .wow-compare-row__delta{font-size:.82rem;font-weight:700;text-align:center}
        .wow-delta--up{color:#22a55f}
        .wow-delta--down{color:#e05555}
        .wow-delta--flat{color:#6c778a}
        .wow-compare-row__val--win{color:#22a55f;font-weight:600}
        .wow-macro-band{font-size:.68rem;color:#6c778a;font-weight:600;margin-top:2px}
        .wow-life-impact-list{list-style:none;padding:0;margin:0}
        .wow-life-impact-list li{padding:10px 0;border-bottom:1px solid #f0f3fa;font-size:.9rem;line-height:1.45}
        .wow-life-impact-list li:last-child{border-bottom:none}
        .wow-econ-split{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .wow-econ-total{margin-top:10px;font-size:.92rem;padding-top:8px;border-top:1px solid #f0f3fa}
        .wow-card--tradeoff{border-left:4px solid #f2c86b}
        .wow-cta-row{display:flex;flex-direction:column;gap:10px;margin-top:8px}
        .wow-cta--secondary{background:#fff!important;color:#3b6bdc!important;border:2px solid #3b6bdc!important}
        .wow-cta--secondary:hover{background:#f3f6fb!important}
        .wow-daily-life__grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px}
        .wow-readiness-gauge{margin:10px 0 6px}
        .wow-readiness-gauge__bar{height:10px;background:#e8eaed;border-radius:50px;overflow:hidden}
        .wow-readiness-gauge__fill{height:100%;background:linear-gradient(90deg,#e05555 0%,#f2b203 50%,#22a55f 100%);border-radius:50px;transition:width .3s ease}
        .wow-readiness-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f0f3fa;font-size:.88rem}
        .wow-readiness-row:last-child{border-bottom:none}
        .wow-readiness-label{flex:1;font-weight:600;color:#0d1b36}
        .wow-readiness-value{width:36px;text-align:center;font-weight:700;color:#3b6bdc}
        .wow-readiness-band{min-width:80px;font-weight:600;color:#6c778a;font-size:.8rem}
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
