"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useMemo } from "react";
import RadarChart from "./RadarChart";
import { useExpats } from "../../../hooks/expats/useExpats";
import type {
  CityScoreResponse,
  MacroareeScores,
  BudgetCheck,
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

const MOCK_RADAR = [
  { label: "Cost Of Living", shortLabel: "Cost\nOf Living", value: 48 },
  { label: "Economic Power", shortLabel: "Economic\nPower", value: 72 },
  { label: "Quality Of Life", shortLabel: "Quality\nOf Life", value: 73 },
  { label: "Housing Market", shortLabel: "Housing\nMarket", value: 52 },
  { label: "Social Integration", shortLabel: "Social\nIntegration", value: 89 },
  { label: "Work Opportunities", shortLabel: "Work\nOpportunities", value: 87 },
];

function radarFromScore(score: CityScoreResponse | null) {
  if (!score?.radarValues) return MOCK_RADAR;
  const rv = score.radarValues;
  return (Object.keys(MACROAREA_LABELS) as (keyof MacroareeScores)[]).map((k) => ({
    label: MACROAREA_LABELS[k].label,
    shortLabel: MACROAREA_LABELS[k].short,
    value: Math.round(rv[k] ?? 0),
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

function budgetClassLabel(classification: string | undefined) {
  if (classification === "sustainable") return { text: "Sustainable with your budget", color: "#22a55f" };
  if (classification === "tight") return { text: "Tight, but manageable", color: "#f2b203" };
  return { text: "Over budget — adjustments needed", color: "#e05555" };
}

// ─── WOW Page – Planning Move ─────────────────────────────────────────────────

function WowPlanningMove({
  cityName = "Lisbon",
  score: apiScore,
  funnelBudget = 2500,
}: {
  cityName?: string;
  score?: CityScoreResponse | null;
  funnelBudget?: number;
}) {
  const router = useRouter();

  const totalScore = apiScore?.scoreTotal ?? 92;
  const compat = compatLabel(apiScore?.compatibilityLevel, totalScore);
  const radar = radarFromScore(apiScore ?? null);
  const budget: BudgetCheck = apiScore?.budgetCheck ?? {
    declaredBudget: funnelBudget,
    estimatedCost: 2075,
    margin: funnelBudget - 2075,
    classification: "sustainable",
    lifestyleMultiplier: 1,
  };
  const insights = apiScore?.insights;
  const budgetLabel = budgetClassLabel(budget.classification);

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">{cityName} Could Fit Your Life Surprisingly Well</h1>
        <p className="wow-sub">
          Based On Your Answers, {cityName} Aligns Strongly With Several Of Your Priorities.
          <br />Let's See How Realistic Your Move Could Be.
        </p>
      </div>

      <div className="wow-grid wow-grid--3">
        {/* ── LEFT ── */}
        <div className="wow-col">
          <div className="wow-card wow-card--row">
            <img src={`${IMG}/image%202308.png`} alt="Zyra" className="wow-avatar" />
            <div>
              <p className="wow-bold">Hello! I'm Zyra,</p>
              <p className="wow-muted-sm">Your AI Mentor Here.</p>
            </div>
          </div>

          <div className="wow-card">
            <div className="wow-card--row" style={{ marginBottom: 12 }}>
              <img src={`${IMG}/image%202441.png`} alt="" className="wow-icon-40" />
              <div>
                <p className="wow-muted-sm" style={{ fontWeight: 700, color: '#0d1b36' }}>Relocation Readiness Score</p>
                <p className="wow-big-num">65<span className="wow-big-num__sub">/100</span></p>
              </div>
            </div>
            <img src={`${IMG}/image%202440.png`} alt="Gauge" className="wow-gauge-img" />
            <div className="wow-card--row" style={{ gap: 8, marginTop: 6 }}>
              <img src={`${IMG}/image%202424.png`} alt="" style={{ width: 24, height: 16, objectFit: 'cover', borderRadius: 2 }} />
              <img src={`${IMG}/image%202425%20(1).png`} alt="" style={{ width: 24, height: 16, objectFit: 'cover', borderRadius: 2 }} />
            </div>
            <p className="wow-muted-sm" style={{ marginTop: 8 }}>Your Move Looks Possible, But Housing Strategy Matters</p>
            <span className="wow-badge-orange">Moderate</span>
          </div>

          <div className="wow-card wow-card--center">
            <img src={`${IMG}/Rectangle%203465283.png`} alt="" className="wow-img-120" />
            <p className="wow-bold">90-Day Structural Plan</p>
            <p className="wow-muted-sm">3 decisions are slowing your growth:</p>
            <ul className="wow-accent-list">
              <li>Housing timing</li>
              <li>Network leverage</li>
              <li>Margin allocation</li>
            </ul>
          </div>
        </div>

        {/* ── CENTER ── */}
        <div className="wow-col">
          <h2 className="wow-section-title">{cityName} Compatibility Overview</h2>
          <div className="wow-city-hero">
            <img src={`${IMG}/Rectangle%203465225.png`} alt={cityName} className="wow-city-hero__img" />
            <span className="wow-compat-badge" style={{ background: compat.color }}>
              {totalScore}% {compat.text}
            </span>
          </div>

          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 8 }}>Connect With Compatible Locals And Mentors</p>
            <p className="wow-muted-sm">26 Experts With Similar Timing</p>
            <p className="wow-muted-sm">8 Experts Already In The Area</p>
            <p className="wow-muted-sm">4 Profiles &gt; 80% Compatible</p>
            <img src={`${IMG}/Group%201686559670.png`} alt="Mentors" className="wow-mentors-row" />
          </div>

          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 8 }}>Your Full Relocation Analysis Includes</p>
            <img src={`${IMG}/image%202436.png`} alt="Neighbourhoods" className="wow-img-160" style={{ margin: '8px auto' }} />
            <p className="wow-muted-sm">Best Neighbourhoods For Your Lifestyle</p>
            <ul className="wow-accent-list">
              <li>Ruzafa</li>
              <li>Cabanyal</li>
              <li>Benimaclet</li>
            </ul>
          </div>

          <button onClick={() => router.push("/register?from=expats")} className="wow-cta">
            See My Full Relocation Analysis
          </button>
          <p className="wow-cta-sub">🔒 Free account · Personalized results · No credit card required</p>
        </div>

        {/* ── RIGHT ── */}
        <div className="wow-col">
          <div className="wow-card wow-card--center">
            <p className="wow-bold">{cityName} Compatibility <span className="wow-accent">Breakdown</span></p>
            <RadarChart data={radar} size={240} color="#3b6bdc" />
          </div>

          <div className="wow-card wow-card--center">
            <img src={`${IMG}/Rectangle%203464893.png`} alt="" className="wow-img-100" />
            <p className="wow-bold">Financial Comfort Index</p>
            {insights?.suggestions?.[0] && (
              <p className="wow-muted-sm">{insights.suggestions[0]}</p>
            )}
            <p className="wow-muted-sm">Estimated Monthly Reality</p>
            <p className="wow-budget-line">€{budget.estimatedCost.toLocaleString()} needed for your lifestyle</p>
            <p className="wow-budget-check" style={{ color: budgetLabel.color }}>✓ {budgetLabel.text}</p>
            <div className="wow-insight-box">
              <strong>Insight:</strong> You can live comfortably in {cityName}, but lifestyle choices will define your financial flexibility.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── WOW Page – Already There ─────────────────────────────────────────────────

function WowAlreadyThere({
  cityName = "Lisbon",
  score: apiScore,
}: {
  cityName?: string;
  score?: CityScoreResponse | null;
}) {
  const router = useRouter();
  const radar = radarFromScore(apiScore ?? null);
  const budget: BudgetCheck = apiScore?.budgetCheck ?? {
    declaredBudget: 2500, estimatedCost: 2075, margin: 425, classification: "sustainable", lifestyleMultiplier: 1,
  };
  const budgetLabel = budgetClassLabel(budget.classification);

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">You're In {cityName}. But Are You Using The City At Its Full Potential?</h1>
        <p className="wow-sub">Based On Your Profile, There Are Several Ways {cityName} Could Work Better For Your Lifestyle.</p>
      </div>
      <div className="wow-grid wow-grid--3">
        <div className="wow-col">
          <div className="wow-card wow-card--row">
            <img src={`${IMG}/image%202308.png`} alt="Zyra" className="wow-avatar" />
            <div><p className="wow-bold">Hello! I'm Zyra,</p><p className="wow-muted-sm">Your AI Mentor Here.</p></div>
          </div>
          <div className="wow-card">
            <p className="wow-body-text">
              Your Current City Aligns With Several Of Your <strong>Lifestyle Priorities</strong>, Though Some Aspects May Require <strong>Strategic Adjustments.</strong>
            </p>
          </div>
          <div className="wow-card wow-card--center">
            <img src={`${IMG}/Rectangle%203465283.png`} alt="" className="wow-img-120" />
            <p className="wow-bold">90-Day Structural Plan</p>
            <p className="wow-muted-sm">3 decisions are slowing your growth:</p>
            <ul className="wow-accent-list">
              <li>Housing timing</li><li>Network leverage</li><li>Margin allocation</li>
            </ul>
          </div>
        </div>

        <div className="wow-col">
          <div className="wow-card wow-card--center">
            <h2 className="wow-section-title">Your {cityName} Alignment Map</h2>
            <img src={`${IMG}/image%202430.png`} alt="" className="wow-img-100" />
            <p className="wow-muted-sm" style={{ textAlign: 'center', lineHeight: 1.6 }}>
              Six layers define your positioning inside the city.<br />
              Right now, they move — but not in sync. Misalignment doesn't block growth. It slows it.
            </p>
          </div>
          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 4 }}>Insights You Haven't Seen Yet</p>
            <p className="wow-bold-sm">Connect With Compatible Locals And Mentors</p>
            <p className="wow-muted-sm">26 Experts With Similar Timing</p>
            <p className="wow-muted-sm">8 Experts Already In The Area</p>
          </div>
          <div className="wow-card">
            <p className="wow-bold">Best Neighborhoods To Explore Next</p>
            <ul className="wow-accent-list"><li>Ruzafa</li><li>Cabanyal</li><li>Benimaclet</li></ul>
          </div>
          <button onClick={() => router.push("/register?from=expats")} className="wow-cta">
            See My Full {cityName} Analysis →
          </button>
          <p className="wow-cta-sub">Preview unlocked. Full system activates after registration.</p>
        </div>

        <div className="wow-col">
          <div className="wow-card wow-card--center">
            <p className="wow-bold">{cityName} Compatibility <span className="wow-accent">Breakdown</span></p>
            <RadarChart data={radar} size={220} color="#3b6bdc" />
          </div>
          <div className="wow-card wow-card--center">
            <img src={`${IMG}/image%202428.png`} alt="" className="wow-img-60" />
            <p className="wow-bold">Financial Comfort Index</p>
            <p className="wow-budget-line">€{budget.estimatedCost.toLocaleString()} needed for your lifestyle</p>
            <p className="wow-budget-check" style={{ color: budgetLabel.color }}>✓ {budgetLabel.text}</p>
            <div className="wow-insight-box">
              <strong>Insight:</strong> You can live comfortably, but lifestyle choices will define your financial flexibility.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── WOW Page – Comparison ────────────────────────────────────────────────────

function WowComparison({
  currentCity = "Milan",
  targetCity = "Valencia",
  targetScore,
}: {
  currentCity?: string;
  targetCity?: string;
  targetScore?: CityScoreResponse | null;
}) {
  const router = useRouter();
  const radar = radarFromScore(targetScore ?? null);

  const COMPARISON = [
    { label: "Cost Of Living", current: "▲ High", target: "✓ Lower", win: "target" as const },
    { label: "Housing Market", current: "▲ Competitive", target: "✓ Easier", win: "target" as const },
    { label: "Economic Power", current: "✓ Strong", target: "⚖ Moderate", win: "current" as const },
    { label: "Quality Of Life", current: "▲ Stressful", target: "✓ Relaxed", win: "target" as const },
    { label: "Career Opportunities", current: "✓ Strong", target: "⚖ Moderate", win: "current" as const },
    { label: "Social Integration", current: "▲ Harder", target: "✓ Easier", win: "target" as const },
  ];

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">How Would Your Life Change If You Moved From {currentCity} To {targetCity}?</h1>
        <p className="wow-sub">Based On Your Priorities, Syncro Compared Both Cities Across Cost, Lifestyle, Work And Social Integration.</p>
      </div>

      <div className="wow-grid wow-grid--3c">
        <div className="wow-col">
          <div className="wow-card wow-card--center">
            <p className="wow-muted-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, fontStyle: 'italic' }}>Better Match For Your Profile</p>
            <img src={`${IMG}/image%202425.png`} alt="Trophy" className="wow-img-60" />
            <h2 className="wow-winner-city">{targetCity.toUpperCase()}</h2>
            <ul className="wow-accent-list">
              <li>Lower Housing Pressure</li>
              <li>Better Lifestyle Balance</li>
              <li>Easier Social Integration</li>
            </ul>
          </div>
          <div className="wow-card">
            <p className="wow-bold" style={{ marginBottom: 8 }}>Your Full Relocation Analysis Includes:</p>
            <img src={`${IMG}/image%202436.png`} alt="" className="wow-img-160" style={{ margin: '8px auto' }} />
            <p className="wow-muted-sm">Best Neighbourhoods For Your Lifestyle</p>
            <ul className="wow-accent-list"><li>Ruzafa</li><li>Cabanyal</li><li>Benimaclet</li></ul>
          </div>
        </div>

        <div className="wow-col">
          <div className="wow-compare-cities">
            <img src={`${IMG}/Rectangle%203465225%20(1).png`} alt={currentCity} className="wow-compare-img" />
            <img src={`${IMG}/Rectangle%203465253.png`} alt={targetCity} className="wow-compare-img" />
          </div>
          <div className="wow-compare-table">
            <div className="wow-compare-hdr">
              <div />
              <div className="wow-compare-hdr__city">🇮🇹 {currentCity.toUpperCase()}</div>
              <div className="wow-compare-hdr__city">🇪🇸 {targetCity.toUpperCase()}</div>
            </div>
            {COMPARISON.map((r) => (
              <div key={r.label} className="wow-compare-row">
                <div className="wow-compare-row__label">{r.label}</div>
                <div className={`wow-compare-row__val ${r.win === "current" ? "wow-compare-row__val--win" : ""}`}>{r.current}</div>
                <div className={`wow-compare-row__val ${r.win === "target" ? "wow-compare-row__val--win" : ""}`}>{r.target}</div>
              </div>
            ))}
          </div>
          <div className="wow-card wow-card--center">
            <p className="wow-bold-sm">Your Monthly Life Simulation</p>
            <div className="wow-economy-row">
              <div className="wow-economy-col"><span>🇮🇹</span><strong>{currentCity}</strong><p className="wow-economy-price">2.150€</p></div>
              <div className="wow-economy-col"><span>🇪🇸</span><strong>{targetCity}</strong><p className="wow-economy-price">1.853€</p></div>
            </div>
            <p className="wow-muted-sm">💰 Estimated Saving: <strong style={{ color: '#22a55f' }}>+3.564€ Per Year</strong></p>
          </div>
          <button onClick={() => router.push("/register?from=expats")} className="wow-cta">See My Full Relocation Analysis</button>
        </div>

        <div className="wow-col">
          <div className="wow-card wow-card--row">
            <img src={`${IMG}/image%202308.png`} alt="Zyra" className="wow-avatar" />
            <div><p className="wow-bold">Hello! I'm Zyra,</p><p className="wow-muted-sm">Your AI Mentor Here.</p></div>
          </div>
          <div className="wow-card wow-card--center">
            <p className="wow-bold">{targetCity} Compatibility <span className="wow-accent">Breakdown</span></p>
            <RadarChart data={radar} size={200} color="#3b6bdc" />
          </div>
          <div className="wow-card">
            <div className="wow-card--row" style={{ marginBottom: 8 }}>
              <img src={`${IMG}/image%202441.png`} alt="" className="wow-icon-40" />
              <div>
                <p className="wow-muted-sm" style={{ fontWeight: 700, color: '#0d1b36' }}>Relocation Readiness Score</p>
                <p className="wow-big-num">65<span className="wow-big-num__sub">/100</span></p>
              </div>
            </div>
            <p className="wow-muted-sm">Your Move Looks Possible, But Housing Strategy Matters</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── WOW Page – Unsure ────────────────────────────────────────────────────────

function WowUnsure({ scores }: { scores?: CityScoreResponse[] }) {
  const router = useRouter();

  const TOP_CITIES = useMemo(() => {
    if (scores && scores.length > 0) {
      return scores.slice(0, 3).map((s, i) => ({
        name: s.cityName,
        country: s.country,
        score: s.scoreTotal,
        flag: "🌍",
        radar: radarFromScore(s),
        img: i === 0
          ? `${IMG}/Rectangle%203465253.png`
          : i === 1
            ? `${IMG}/Rectangle%203465225.png`
            : `${IMG}/Rectangle%203465253.png`,
      }));
    }
    return [
      { name: "Valencia", country: "Spain", score: 88, flag: "🇪🇸", radar: MOCK_RADAR, img: `${IMG}/Rectangle%203465253.png` },
      { name: "Lisbon", country: "Portugal", score: 82, flag: "🇵🇹", radar: MOCK_RADAR.map(d => ({ ...d, value: Math.max(20, d.value - 8) })), img: `${IMG}/Rectangle%203465225.png` },
      { name: "Barcelona", country: "Spain", score: 79, flag: "🇪🇸", radar: MOCK_RADAR.map(d => ({ ...d, value: Math.max(20, d.value - 16) })), img: `${IMG}/Rectangle%203465253.png` },
    ];
  }, [scores]);

  return (
    <>
      <div className="wow-header">
        <h1 className="wow-title">Based On Your Profile, These Cities Could Transform Your Life</h1>
        <p className="wow-sub">We Analyzed Your Priorities And Found Your Top City Matches.</p>
      </div>
      <div className="wow-unsure-grid">
        {TOP_CITIES.map((city, i) => (
          <div key={city.name} className={`wow-city-card ${i === 0 ? "wow-city-card--top" : ""}`}>
            <div className="wow-city-rank">#{i + 1}</div>
            <img src={city.img} alt={city.name} className="wow-city-card__img" />
            <div className="wow-city-card__body">
              <h3 className="wow-bold">{city.flag} {city.name}</h3>
              <p className="wow-muted-sm">{city.country}</p>
              <div className="wow-score-bar"><div className="wow-score-fill" style={{ width: `${city.score}%` }} /></div>
              <p className="wow-muted-sm"><strong>{city.score}%</strong> Compatibility</p>
            </div>
            <div style={{ padding: '0 16px 16px', textAlign: 'center' }}>
              <RadarChart data={city.radar} size={160} color="#3b6bdc" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => router.push("/register?from=expats")} className="wow-cta" style={{ marginTop: 32 }}>
        See My Full City Rankings
      </button>
      <p className="wow-cta-sub">Free account · Unlock all {TOP_CITIES.length}+ city matches</p>
    </>
  );
}

// ─── Main WOW Page ────────────────────────────────────────────────────────────

export default function WowPage() {
  const router = useRouter();
  const { funnelAnswers, scoringResult, initSession, computeScoring, session } = useExpats();
  const initialized = useRef(false);
  const scoringAttempted = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initSession().catch(() => {
        router.replace("/expats");
      });
    }
  }, [initSession, router]);

  useEffect(() => {
    if (!scoringAttempted.current && session && !scoringResult) {
      scoringAttempted.current = true;
      computeScoring().catch(() => {
        // Anonymous users will get 401 — silently fall back to mock data
      });
    }
  }, [session, scoringResult, computeScoring]);

  const userPhase = funnelAnswers.userPhase;
  const targetType = funnelAnswers.targetType;
  const targetCity = funnelAnswers.targetCityName;
  const currentCity = funnelAnswers.currentCityName;

  const topScore = scoringResult?.scores?.[0] ?? null;

  const renderContent = () => {
    if (userPhase === "already_there") {
      return <WowAlreadyThere cityName={currentCity || "Lisbon"} score={topScore} />;
    }
    if (targetType === "not_sure") {
      return <WowUnsure scores={scoringResult?.scores} />;
    }
    if (targetType === "already_live") {
      return <WowAlreadyThere cityName={currentCity || "Your City"} score={topScore} />;
    }
    if (targetCity && currentCity && targetType === "specific_city") {
      return <WowComparison currentCity={currentCity} targetCity={targetCity} targetScore={topScore} />;
    }
    return (
      <WowPlanningMove
        cityName={targetCity || "Lisbon"}
        score={topScore}
        funnelBudget={funnelAnswers.monthlyBudget || 2500}
      />
    );
  };

  return (
    <div className="wow-page">
      {/* ── Top Bar ── */}
      <header className="wow-topbar">
        <div className="wow-lang-btn">
          <img src={`${IMG}/image%202424.png`} alt="IT" className="wow-lang-flag" />
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#6c778a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div className="wow-logo">
          <span className="wow-logo__sym">∞</span>
          <span className="wow-logo__txt"><strong>EXPATS</strong> MODE</span>
        </div>
        <div style={{ width: 60 }} />
      </header>

      <main className="wow-main">{renderContent()}</main>

      <style>{`
        /* ═══════ RESET / SHELL ═══════ */
        .wow-page{min-height:100vh;background:#f7f9fc;font-family:'Inter',var(--font-geist-sans,system-ui,sans-serif);color:#0d1b36}
        .wow-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 32px;background:#fff;border-bottom:1px solid #e8ecf4;position:sticky;top:0;z-index:10}
        .wow-logo{display:flex;align-items:center;gap:8px;font-size:1.05rem;color:#0d1b36}
        .wow-logo__sym{font-size:1.6rem;color:#3b6bdc}
        .wow-lang-btn{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e4e9f2;border-radius:10px;padding:7px 12px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.05)}
        .wow-lang-flag{width:30px;height:20px;object-fit:cover;border-radius:2px}
        .wow-main{max-width:1180px;margin:0 auto;padding:36px 24px 80px}

        /* ═══════ TYPOGRAPHY ═══════ */
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

        /* ═══════ GRID ═══════ */
        .wow-grid--3{display:grid;grid-template-columns:255px 1fr 275px;gap:18px;align-items:start}
        .wow-grid--3c{display:grid;grid-template-columns:230px 1fr 255px;gap:18px;align-items:start}
        .wow-col{display:flex;flex-direction:column;gap:16px}

        /* ═══════ CARD ═══════ */
        .wow-card{background:#fff;border:1px solid #e8ecf4;border-radius:14px;padding:18px;box-shadow:0 1px 4px rgba(0,0,0,.03)}
        .wow-card--row{display:flex;align-items:center;gap:12px}
        .wow-card--center{text-align:center}

        /* ═══════ IMAGES ═══════ */
        .wow-avatar{width:48px;height:48px;object-fit:contain;flex-shrink:0}
        .wow-icon-40{width:42px;height:42px;object-fit:contain;flex-shrink:0}
        .wow-gauge-img{width:100%;height:24px;object-fit:contain;margin:4px 0}
        .wow-img-60{width:60px;height:60px;object-fit:contain;margin:8px auto;display:block}
        .wow-img-100{width:100px;height:auto;object-fit:contain;margin:0 auto 10px;display:block}
        .wow-img-120{width:120px;height:auto;object-fit:contain;margin:0 auto 10px;display:block}
        .wow-img-160{width:160px;height:auto;object-fit:contain;display:block}
        .wow-mentors-row{width:100%;max-width:220px;height:auto;margin:12px auto 0;display:block}

        /* ═══════ CITY HERO ═══════ */
        .wow-city-hero{position:relative;border-radius:14px;overflow:hidden;margin-bottom:14px}
        .wow-city-hero__img{width:100%;height:210px;object-fit:cover;display:block}
        .wow-compat-badge{position:absolute;bottom:12px;left:12px;color:#fff;font-size:.88rem;font-weight:700;padding:8px 16px;border-radius:50px}

        /* ═══════ BADGES ═══════ */
        .wow-badge-orange{display:inline-block;background:#FFF3E0;color:#F57C00;font-size:.78rem;font-weight:700;padding:4px 14px;border-radius:50px;margin-top:6px}

        /* ═══════ LISTS ═══════ */
        .wow-accent-list{font-size:.85rem;color:#3b6bdc;padding-left:18px;margin:6px 0 0;line-height:2;list-style:disc}

        /* ═══════ BUDGET / INSIGHT ═══════ */
        .wow-budget-line{font-size:.88rem;font-weight:600;color:#1a2433;margin:4px 0}
        .wow-budget-check{font-size:.84rem;font-weight:600;margin-bottom:8px}
        .wow-insight-box{font-size:.8rem;color:#6c778a;line-height:1.5;background:#f7f9fc;border-radius:10px;padding:12px;margin-top:6px}

        /* ═══════ CTA ═══════ */
        .wow-cta{width:100%;background:#f07a30;color:#fff;border:none;border-radius:50px;padding:16px 24px;font-size:1.02rem;font-weight:700;cursor:pointer;transition:background .2s;margin-top:6px}
        .wow-cta:hover{background:#d96a20}
        .wow-cta-sub{text-align:center;font-size:.78rem;color:#6c778a;margin-top:8px}

        /* ═══════ COMPARE TABLE ═══════ */
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

        /* ═══════ UNSURE / CITY CARDS ═══════ */
        .wow-unsure-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        .wow-city-card{background:#fff;border:1px solid #e8ecf4;border-radius:16px;overflow:hidden;position:relative;transition:box-shadow .2s}
        .wow-city-card:hover{box-shadow:0 6px 24px rgba(59,107,220,.1)}
        .wow-city-card--top{border-color:#3b6bdc;box-shadow:0 4px 20px rgba(59,107,220,.12)}
        .wow-city-rank{position:absolute;background:#3b6bdc;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem;margin:12px;z-index:1}
        .wow-city-card__img{width:100%;height:155px;object-fit:cover}
        .wow-city-card__body{padding:16px}
        .wow-score-bar{height:8px;background:#e4e9f2;border-radius:50px;margin:8px 0;overflow:hidden}
        .wow-score-fill{height:100%;background:#3b6bdc;border-radius:50px}

        /* ═══════ RESPONSIVE ═══════ */
        @media(max-width:960px){
          .wow-grid--3,.wow-grid--3c{grid-template-columns:1fr}
          .wow-unsure-grid{grid-template-columns:1fr}
          .wow-compare-cities{flex-direction:column}
        }
      `}</style>
    </div>
  );
}
