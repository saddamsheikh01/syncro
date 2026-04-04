"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/hooks";
import { useStarterKit } from "../../../hooks/expats/useStarterKit";
import ScoreCard from "./ScoreCard";
import PlanTabs from "../shared/PlanTabs";

export default function StarterKitPage() {
  const { t } = useT();
  const router = useRouter();
  const { isLoading, starterKit, generateKit, loadLatestKit } = useStarterKit();

  useEffect(() => {
    loadLatestKit();
  }, [loadLatestKit]);

  const payload = starterKit?.payload ?? {};

  // Extract sections from payload (adapts to both backend formats)
  const citySnapshot = payload.cityAlignmentSnapshot as Record<string, unknown> | undefined
    ?? payload.cityAnalysis as Record<string, unknown> | undefined;
  const cityFitCards = (payload.cityFitCards ?? []) as { indicator: string; score: number; level: string; message: string; cta?: string }[];
  const stressLevel = payload.initialStressLevel as { score: number; level: string; description?: string } | undefined;
  const riskLevel = payload.relocationRisk as { score: number; level: string; description?: string } | undefined;

  // Build score data from cityFitCards or macroaree
  const CARD_META: Record<string, { icon: string; title: string; ctaDesc?: string }> = {
    work_opportunities: { icon: "💼", title: "Work Opportunities", ctaDesc: "Talk To A Career Advisor Who Can Explain How The Local Job Market Works." },
    housing_market: { icon: "🏠", title: "Housing Affordability", ctaDesc: "Talk To A Local Real Estate Agent Who Understands The Rental Market." },
    social_integration: { icon: "👥", title: "Social Integration", ctaDesc: "Connect With Other Expats And Locals In The Syncro Lounge." },
    quality_of_life: { icon: "🌟", title: "Quality Of Life" },
    economic_power: { icon: "💰", title: "Economic Power" },
    cost_of_living: { icon: "🛒", title: "Cost Of Living" },
  };

  const LEVEL_MAP: Record<string, string> = {
    HIGH: "Strong", GOOD: "Good", MEDIUM: "Moderate", LOW: "Weak", VERY_LOW: "Weak",
  };

  // Snapshot text from backend — strengths/attention can be strings or objects
  const rawStrengths = (citySnapshot as Record<string, unknown>)?.strengths;
  const snapshotStrengths: string[] | undefined = Array.isArray(rawStrengths)
    ? rawStrengths.map((s: unknown) => (typeof s === "string" ? s : (s as Record<string, unknown>)?.message as string ?? ""))
    : undefined;
  const rawAttention = (citySnapshot as Record<string, unknown>)?.attention;
  const snapshotAttention: string | undefined = typeof rawAttention === "string"
    ? rawAttention
    : (rawAttention as Record<string, unknown>)?.message as string | undefined;
  const snapshotSummary = (citySnapshot as Record<string, unknown>)?.summary as string | undefined;
  const cityName = starterKit ? String((citySnapshot as Record<string, unknown>)?.cityName ?? "") : "";

  // Budget analysis
  const budgetAnalysis = payload.budgetAnalysis as {
    minimumRealisticBudget?: number; rent?: number; livingExpenses?: number;
    userBudget?: number; margin?: number; marginStatus?: string; isFamily?: boolean;
  } | undefined;

  // Quick actions
  const quickActions = (payload.quickActions ?? []) as { title: string; description: string; category: string }[];

  // Scam sentinel
  const scamSentinel = payload.scamSentinel as { warnings: string[]; country?: string; city?: string } | undefined;

  // Common relocation mistake (SUPER_PRO) or generic
  const commonMistake = payload.commonRelocationMistake as { title?: string; description?: string; severity?: string } | undefined;

  const hasContent = starterKit && (cityFitCards.length > 0 || citySnapshot || budgetAnalysis);

  return (
    <>
      <div className="sk-shell">
        <h1 className="sk-title">{t("Expat Starter Kit")}</h1>

        <PlanTabs />

        {!starterKit && !isLoading && (
          <div className="sk-empty">
            <p>{t("No starter kit generated yet.")}</p>
            <button className="sk-generate-btn" onClick={() => generateKit()} type="button">
              {t("Generate your Starter Kit")}
            </button>
          </div>
        )}

        {isLoading && !starterKit && (
          <div className="sk-empty">
            <p>{t("Generating...")}</p>
          </div>
        )}

        {hasContent && (
          <>
            {/* ── City Alignment Snapshot ─────────────────────── */}
            {citySnapshot && (
              <div className="sk-snapshot">
                <div className="sk-snapshot__header">
                  <span className="sk-snapshot__icon">🏙️</span>
                  <h2 className="sk-snapshot__title">{t("City Alignment Snapshot")}</h2>
                </div>
                <div className="sk-snapshot__body">
                  {snapshotSummary && <p>{snapshotSummary}</p>}
                  {snapshotStrengths && snapshotStrengths.length > 0 && (
                    snapshotStrengths.map((s, i) => <p key={i}>{s}</p>)
                  )}
                  {!snapshotSummary && !snapshotStrengths && (
                    <p>
                      {t("Based On Your Priorities")}, <strong>{cityName}</strong> {t("Appears Broadly Compatible With Your Lifestyle And Professional Goals.")}
                    </p>
                  )}
                  {snapshotAttention && <p><strong>{t("Attention")}:</strong> {snapshotAttention}</p>}
                </div>
              </div>
            )}

            {/* ── Score Cards Grid ───────────────────────────── */}
            <div className="sk-grid">
              {cityFitCards.map((card) => {
                const meta = CARD_META[card.indicator] ?? { icon: "📊", title: card.indicator };
                const title = meta.title ?? card.indicator ?? "Unknown";
                const levelLabel = LEVEL_MAP[card.level] ?? card.level ?? "—";
                return (
                  <ScoreCard
                    key={card.indicator}
                    icon={meta.icon}
                    title={t(title)}
                    score={Math.round(card.score ?? 0)}
                    level={t(levelLabel)}
                    description={card.message ?? ""}
                    ctaLabel={undefined}
                    ctaDescription={undefined}
                  />
                );
              })}

              {/* ── Initial Stress Level ──────────────────────── */}
              {stressLevel && (
                <ScoreCard
                  icon="😰"
                  title={t("Initial Stress Level")}
                  score={Math.round((1 - stressLevel.score / 8) * 100)}
                  level={t(stressLevel.level === "LOW" ? "Low" : stressLevel.level === "MEDIUM" ? "Moderate" : "High")}
                  description={stressLevel.description ?? t("Your Relocation Conditions Appear Relatively Stable.")}
                  ctaLabel={undefined}
                  ctaDescription={undefined}
                />
              )}

              {/* ── Relocation Risk Level ─────────────────────── */}
              {riskLevel && (
                <ScoreCard
                  icon="⚠️"
                title={t("Relocation Risk Level")}
                score={Math.round((1 - riskLevel.score / 6) * 100)}
                level={t(riskLevel.level === "LOW" ? "Low" : riskLevel.level === "MEDIUM" ? "Medium" : "High")}
                description={riskLevel.description ?? t("Your Relocation Appears Feasible, But Some Elements May Require Careful Planning.")}
                ctaLabel={undefined}
                ctaDescription={undefined}
              />
            )}
            </div>

            {/* ── Budget Minimo Realistico ──────────────────── */}
            {budgetAnalysis && (
              <div className="sk-card">
                <div className="sk-card__header">
                  <span className="sk-card__icon">💰</span>
                  <h2 className="sk-card__title">{t("Realistic Minimum Budget")}</h2>
                </div>
                <div className="sk-budget-grid">
                  <div className="sk-budget-item">
                    <span className="sk-budget-label">{t("Rent")}</span>
                    <strong>€{(budgetAnalysis.rent ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="sk-budget-item">
                    <span className="sk-budget-label">{t("Living Expenses")}</span>
                    <strong>€{(budgetAnalysis.livingExpenses ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="sk-budget-item">
                    <span className="sk-budget-label">{t("Minimum Budget")}</span>
                    <strong>€{(budgetAnalysis.minimumRealisticBudget ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="sk-budget-item">
                    <span className="sk-budget-label">{t("Your Budget")}</span>
                    <strong>€{(budgetAnalysis.userBudget ?? 0).toLocaleString()}</strong>
                  </div>
                </div>
                <div className="sk-budget-margin">
                  <span>{t("Margin")}: <strong style={{ color: (budgetAnalysis.margin ?? 0) >= 0 ? "#16a34a" : "#dc2626" }}>€{(budgetAnalysis.margin ?? 0).toLocaleString()}</strong></span>
                  <span className="sk-budget-status" data-status={budgetAnalysis.marginStatus}>{budgetAnalysis.marginStatus ?? "—"}</span>
                </div>
              </div>
            )}

            {/* ── 3 Azioni in 7 Giorni ─────────────────────── */}
            {quickActions.length > 0 && (
              <div className="sk-card">
                <div className="sk-card__header">
                  <span className="sk-card__icon">⚡</span>
                  <h2 className="sk-card__title">{t("Actions in 7 Days")}</h2>
                </div>
                <div className="sk-actions-list">
                  {quickActions.map((action, i) => (
                    <div key={i} className="sk-action">
                      <span className="sk-action__num">{i + 1}</span>
                      <div>
                        <strong>{action.title}</strong>
                        <p>{action.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Errore Tipico Relocation ──────────────────── */}
            {commonMistake && (
              <div className="sk-card sk-card--warning">
                <div className="sk-card__header">
                  <span className="sk-card__icon">⚠️</span>
                  <h2 className="sk-card__title">{t("Typical Mistake")}</h2>
                </div>
                {commonMistake.title && <p className="sk-mistake-title">{commonMistake.title}</p>}
                {commonMistake.description && <p className="sk-mistake-desc">{commonMistake.description}</p>}
              </div>
            )}

            {/* ── Sentinella Scam ───────────────────────────── */}
            {scamSentinel && (
              <div className="sk-card">
                <div className="sk-card__header">
                  <span className="sk-card__icon">🛡️</span>
                  <h2 className="sk-card__title">{t("Scam Sentinel")}</h2>
                  {scamSentinel.country && (
                    <span className="sk-scam-country">{scamSentinel.city ?? scamSentinel.country}</span>
                  )}
                </div>
                <ul className="sk-scam-list">
                  {scamSentinel.warnings.map((w, i) => (
                    <li key={i}>🚫 {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── CTA ───────────────────────────────────────── */}
            <button
              className="sk-cta"
              onClick={() => router.push("/expats/activation")}
              type="button"
            >
              {t("View Your Relocation Dashboard")}
            </button>

            {/* Regenerate link */}
            <button
              className="sk-regen"
              onClick={() => generateKit()}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? t("Generating...") : t("Regenerate Starter Kit")}
            </button>
          </>
        )}
      </div>
      <style>{`
        .sk-shell {
          max-width: 960px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }
        .sk-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .sk-grid > * {
          margin-bottom: 0 !important;
        }
        @media (max-width: 768px) {
          .sk-grid {
            grid-template-columns: 1fr;
          }
        }
        .sk-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 28px;
        }
        .sk-empty {
          text-align: center;
          padding: 48px 24px;
          color: #6c778a;
        }
        .sk-generate-btn {
          margin-top: 16px;
          padding: 14px 32px;
          background: #3b6bdc;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
        }
        .sk-generate-btn:hover {
          background: #2d5bc7;
        }

        /* City Alignment Snapshot */
        .sk-snapshot {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-left: 4px solid #3b6bdc;
          border-radius: 16px;
          padding: 24px 28px;
          margin-bottom: 16px;
        }
        .sk-snapshot__header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .sk-snapshot__icon {
          font-size: 2.5rem;
        }
        .sk-snapshot__title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0;
        }
        .sk-snapshot__body {
          font-size: 0.9375rem;
          color: #475569;
          line-height: 1.7;
        }
        .sk-snapshot__body strong {
          color: #0d1b36;
        }
        .sk-snapshot__body p {
          margin: 0 0 8px;
        }

        /* Generic card */
        .sk-card {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 16px;
          padding: 24px 28px;
          margin-bottom: 16px;
        }
        .sk-card--warning {
          border-left: 4px solid #f59e0b;
        }
        .sk-card__header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .sk-card__icon {
          font-size: 1.5rem;
        }
        .sk-card__title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0;
        }

        /* Budget analysis */
        .sk-budget-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        @media (max-width: 480px) {
          .sk-budget-grid { grid-template-columns: 1fr; }
        }
        .sk-budget-item {
          background: #f8fafd;
          border-radius: 10px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sk-budget-label {
          font-size: 0.75rem;
          color: #6c778a;
        }
        .sk-budget-item strong {
          font-size: 1.125rem;
          color: #0d1b36;
        }
        .sk-budget-margin {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: #f0f4ff;
          border-radius: 10px;
          font-size: 0.9375rem;
          color: #475569;
        }
        .sk-budget-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          background: #dcfce7;
          color: #16a34a;
        }
        .sk-budget-status[data-status="tight"] { background: #fef9c3; color: #ca8a04; }
        .sk-budget-status[data-status="very_tight"] { background: #ffedd5; color: #ea580c; }
        .sk-budget-status[data-status="unsustainable"] { background: #fee2e2; color: #dc2626; }

        /* Quick actions */
        .sk-actions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sk-action {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          background: #f8fafd;
          border-radius: 12px;
          padding: 16px;
        }
        .sk-action__num {
          width: 32px;
          height: 32px;
          background: #3b6bdc;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .sk-action strong {
          font-size: 0.9375rem;
          color: #0d1b36;
          display: block;
          margin-bottom: 4px;
        }
        .sk-action p {
          font-size: 0.8125rem;
          color: #6c778a;
          margin: 0;
          line-height: 1.4;
        }

        /* Mistake */
        .sk-mistake-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0 0 6px;
        }
        .sk-mistake-desc {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }

        /* Scam sentinel */
        .sk-scam-country {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6c778a;
          margin-left: auto;
        }
        .sk-scam-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sk-scam-list li {
          padding: 10px 0;
          font-size: 0.875rem;
          color: #475569;
          border-bottom: 1px solid #f0f3f8;
          line-height: 1.5;
        }
        .sk-scam-list li:last-child {
          border-bottom: none;
        }

        /* CTA */
        .sk-cta {
          display: block;
          width: 100%;
          max-width: 420px;
          margin: 32px auto 16px;
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
        .sk-cta:hover {
          opacity: 0.9;
        }

        /* Regenerate */
        .sk-regen {
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
        }
        .sk-regen:hover {
          text-decoration: underline;
        }
        .sk-regen:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .sk-shell {
            padding: 20px 16px 48px;
          }
        }
      `}</style>
    </>
  );
}
