"use client";

import { useEffect, useState } from "react";
import { useT } from "@/hooks";
import { useStarterKit } from "../../../hooks/expats/useStarterKit";
import BurnoutGauge from "./BurnoutGauge";
import RiskBadges from "./RiskBadges";

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionSection({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <div className="sk-section">
        <button className="sk-section__header" onClick={() => setOpen(!open)} type="button">
          <span className="sk-section__icon">{icon}</span>
          <span className="sk-section__title">{title}</span>
          <span className={`sk-section__arrow ${open ? "sk-section__arrow--open" : ""}`}>▸</span>
        </button>
        {open && <div className="sk-section__body">{children}</div>}
      </div>
    </>
  );
}

export default function StarterKitPage() {
  const { t } = useT();
  const { isLoading, starterKit, generateKit, loadLatestKit } = useStarterKit();
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadLatestKit();
  }, [loadLatestKit]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateKit();
    } catch {
      // error in store
    } finally {
      setGenerating(false);
    }
  };

  const payload = starterKit?.payload ?? {};
  const cityAnalysis = payload.cityAnalysis as Record<string, unknown> | undefined
    ?? payload.cityAlignmentSnapshot as Record<string, unknown> | undefined;
  const budgetAnalysis = payload.budgetAnalysis as Record<string, unknown> | undefined;
  const quickActions = (payload.quickActions ?? payload.cityFitCards ?? []) as { title: string; description: string; category: string }[];
  const typicalMistake = payload.typicalMistake as { title: string; description: string; severity: string } | undefined
    ?? payload.commonRelocationMistake as { title: string; description: string; severity: string } | undefined;
  const scamSentinel = payload.scamSentinel as { warnings: string[]; country?: string; city?: string } | undefined;
  const burnoutRisk = payload.burnoutRisk as { burnoutIndex: number; level: string } | undefined
    ?? payload.initialStressLevel as { score: number; level: string } | undefined;
  const riskSnapshot = payload.riskSnapshot as { indicators: Record<string, unknown>; burnoutIndex: number; overallRiskLevel: string } | undefined
    ?? payload.relocationRisk as { score: number; level: string } | undefined;

  const burnoutIndex = burnoutRisk
    ? ((burnoutRisk as Record<string, unknown>).burnoutIndex as number ?? (burnoutRisk as Record<string, unknown>).score as number ?? 0)
    : 0;
  const burnoutLevel = burnoutRisk
    ? ((burnoutRisk as Record<string, unknown>).level as string ?? "LOW")
    : "LOW";

  const macroaree = (cityAnalysis as Record<string, unknown>)?.macroaree as Record<string, number> | undefined;

  return (
    <>
      <div className="sk-shell">
        <div className="sk-header">
          <h1 className="sk-title">{t("Starter Kit")}</h1>
          <p className="sk-subtitle">{t("Your personalized relocation report with 7 essential sections")}</p>
        </div>

        {/* Generate / Regenerate CTA */}
        <button
          className="sk-generate-btn"
          onClick={handleGenerate}
          disabled={isLoading || generating}
          type="button"
        >
          {generating
            ? t("Generating...")
            : starterKit
              ? t("Regenerate Starter Kit")
              : t("Generate your Starter Kit")}
        </button>

        {starterKit && (
          <p className="sk-date">
            {t("Generated on")} {new Date(starterKit.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        )}

        {!starterKit && !isLoading && (
          <div className="sk-empty">
            <p>{t("No starter kit generated yet. Click above to create your personalized report.")}</p>
          </div>
        )}

        {starterKit && (
          <div className="sk-sections">
            {/* 1. City Analysis */}
            {cityAnalysis && (
              <AccordionSection title={t("City Analysis")} icon="🏙️" defaultOpen>
                <div className="sk-city">
                  <h4>{String((cityAnalysis as Record<string, unknown>).cityName ?? starterKit.scenario)}</h4>
                  {(cityAnalysis as Record<string, unknown>).country != null && (
                    <span className="sk-country">{String((cityAnalysis as Record<string, unknown>).country)}</span>
                  )}
                  {macroaree && (
                    <div className="sk-macroaree">
                      {Object.entries(macroaree).map(([key, val]) => (
                        <div key={key} className="sk-macro-item">
                          <span className="sk-macro-label">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                          <div className="sk-macro-bar-bg">
                            <div className="sk-macro-bar" style={{ width: `${Math.min(val, 100)}%` }} />
                          </div>
                          <span className="sk-macro-val">{typeof val === "number" ? val.toFixed(1) : val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(cityAnalysis as Record<string, unknown>).safetyIndex != null && (
                    <div className="sk-indices">
                      <span>Safety: {String((cityAnalysis as Record<string, unknown>).safetyIndex)}</span>
                      <span>Healthcare: {String((cityAnalysis as Record<string, unknown>).healthcareIndex)}</span>
                    </div>
                  )}
                </div>
              </AccordionSection>
            )}

            {/* 2. Budget Analysis */}
            {budgetAnalysis && (
              <AccordionSection title={t("Budget Analysis")} icon="💰">
                <div className="sk-budget">
                  <div className="sk-budget-grid">
                    <div className="sk-budget-item">
                      <span className="sk-budget-label">{t("Minimum Realistic Budget")}</span>
                      <span className="sk-budget-value">€{((budgetAnalysis as Record<string, unknown>).minimumRealisticBudget as number ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="sk-budget-item">
                      <span className="sk-budget-label">{t("Your Budget")}</span>
                      <span className="sk-budget-value">€{((budgetAnalysis as Record<string, unknown>).userBudget as number ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="sk-budget-item">
                      <span className="sk-budget-label">{t("Margin")}</span>
                      <span className="sk-budget-value" style={{ color: ((budgetAnalysis as Record<string, unknown>).margin as number ?? 0) >= 0 ? "#16a34a" : "#dc2626" }}>
                        €{((budgetAnalysis as Record<string, unknown>).margin as number ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </AccordionSection>
            )}

            {/* 3. Quick Actions */}
            {quickActions.length > 0 && (
              <AccordionSection title={t("Actions in 7 Days")} icon="⚡">
                <div className="sk-actions">
                  {quickActions.map((action, i) => (
                    <div key={i} className="sk-action-card">
                      <div className="sk-action-num">{i + 1}</div>
                      <div>
                        <h4 className="sk-action-title">{action.title}</h4>
                        <p className="sk-action-desc">{action.description}</p>
                        <span className="sk-action-cat">{action.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            )}

            {/* 4. Typical Mistake */}
            {typicalMistake && (
              <AccordionSection title={t("Typical Mistake")} icon="⚠️">
                <div className="sk-mistake">
                  <div className="sk-mistake__header">
                    <h4>{typicalMistake.title}</h4>
                    <span className="sk-mistake__severity" data-severity={typicalMistake.severity}>
                      {typicalMistake.severity}
                    </span>
                  </div>
                  <p>{typicalMistake.description}</p>
                </div>
              </AccordionSection>
            )}

            {/* 5. Scam Sentinel */}
            {scamSentinel && (
              <AccordionSection title={t("Scam Sentinel")} icon="🛡️">
                <div className="sk-scam">
                  {scamSentinel.country && (
                    <p className="sk-scam-country">{scamSentinel.country}{scamSentinel.city ? ` — ${scamSentinel.city}` : ""}</p>
                  )}
                  <ul className="sk-scam-list">
                    {scamSentinel.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </AccordionSection>
            )}

            {/* 6. Burnout Risk */}
            {burnoutRisk && (
              <AccordionSection title={t("Burnout Risk Index")} icon="🔥">
                <div className="sk-burnout">
                  <BurnoutGauge value={burnoutIndex} size={160} label={burnoutLevel} />
                </div>
              </AccordionSection>
            )}

            {/* 7. Risk Snapshot */}
            {riskSnapshot && (
              <AccordionSection title={t("Risk Snapshot")} icon="📊">
                {"indicators" in riskSnapshot ? (
                  <RiskBadges
                    indicators={(riskSnapshot as { indicators: Record<string, unknown>; overallRiskLevel: string }).indicators}
                    overallRiskLevel={(riskSnapshot as { indicators: Record<string, unknown>; overallRiskLevel: string }).overallRiskLevel}
                  />
                ) : (
                  <div className="sk-risk-simple">
                    <span>{t("Risk Level")}: {(riskSnapshot as { level: string }).level}</span>
                  </div>
                )}
              </AccordionSection>
            )}
          </div>
        )}
      </div>
      <style>{`
        .sk-shell {
          min-height: 100vh;
          background: linear-gradient(180deg, #f8faff 0%, #eef2f9 100%);
          padding: 32px 24px 64px;
          max-width: 800px;
          margin: 0 auto;
        }
        .sk-header { margin-bottom: 24px; }
        .sk-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 8px;
        }
        .sk-subtitle {
          font-size: 0.9375rem;
          color: #6c778a;
          margin: 0;
        }
        .sk-generate-btn {
          width: 100%;
          padding: 14px;
          background: #3b6bdc;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          margin-bottom: 16px;
        }
        .sk-generate-btn:hover:not(:disabled) { background: #2d5bc7; }
        .sk-generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sk-date {
          font-size: 0.8125rem;
          color: #6c778a;
          margin: 0 0 24px;
        }
        .sk-empty {
          text-align: center;
          padding: 48px 24px;
          color: #6c778a;
        }
        .sk-sections { display: flex; flex-direction: column; gap: 12px; }

        /* Accordion */
        .sk-section {
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 14px;
          overflow: hidden;
        }
        .sk-section__header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 22px;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
        }
        .sk-section__icon { font-size: 1.25rem; }
        .sk-section__title {
          flex: 1;
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
        }
        .sk-section__arrow {
          font-size: 1rem;
          color: #6c778a;
          transition: transform 0.2s;
        }
        .sk-section__arrow--open { transform: rotate(90deg); }
        .sk-section__body {
          padding: 0 22px 20px;
        }

        /* City Analysis */
        .sk-city h4 {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0d1b36;
          margin: 0 0 4px;
        }
        .sk-country {
          font-size: 0.8125rem;
          color: #6c778a;
          display: block;
          margin-bottom: 16px;
        }
        .sk-macroaree { display: flex; flex-direction: column; gap: 10px; }
        .sk-macro-item {
          display: grid;
          grid-template-columns: 140px 1fr 40px;
          align-items: center;
          gap: 10px;
        }
        @media (max-width: 480px) {
          .sk-macro-item {
            grid-template-columns: 100px 1fr 36px;
          }
        }
        .sk-macro-label {
          font-size: 0.75rem;
          color: #475569;
          text-transform: capitalize;
        }
        .sk-macro-bar-bg {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .sk-macro-bar {
          height: 100%;
          background: #3b6bdc;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        .sk-macro-val {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0d1b36;
          text-align: right;
        }
        .sk-indices {
          display: flex;
          gap: 20px;
          margin-top: 14px;
          font-size: 0.8125rem;
          color: #475569;
        }

        /* Budget */
        .sk-budget-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 640px) {
          .sk-budget-grid { grid-template-columns: 1fr; }
        }
        .sk-budget-item {
          background: #f8fafd;
          border-radius: 10px;
          padding: 14px;
          text-align: center;
        }
        .sk-budget-label {
          display: block;
          font-size: 0.75rem;
          color: #6c778a;
          margin-bottom: 4px;
        }
        .sk-budget-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0d1b36;
        }

        /* Actions */
        .sk-actions { display: flex; flex-direction: column; gap: 12px; }
        .sk-action-card {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          background: #f8fafd;
          border-radius: 12px;
          padding: 16px;
        }
        .sk-action-num {
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
        .sk-action-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0 0 4px;
        }
        .sk-action-desc {
          font-size: 0.8125rem;
          color: #475569;
          margin: 0 0 6px;
          line-height: 1.4;
        }
        .sk-action-cat {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #3b6bdc;
          text-transform: uppercase;
        }

        /* Mistake */
        .sk-mistake__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .sk-mistake__header h4 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
          margin: 0;
        }
        .sk-mistake__severity {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          background: #fef9c3;
          color: #ca8a04;
        }
        .sk-mistake__severity[data-severity="HIGH"] {
          background: #fee2e2;
          color: #dc2626;
        }
        .sk-mistake p {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }

        /* Scam */
        .sk-scam-country {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0d1b36;
          margin: 0 0 12px;
        }
        .sk-scam-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sk-scam-list li {
          padding: 8px 0 8px 24px;
          font-size: 0.8125rem;
          color: #475569;
          border-bottom: 1px solid #f0f3f8;
          position: relative;
        }
        .sk-scam-list li::before {
          content: "🚫";
          position: absolute;
          left: 0;
        }

        /* Burnout */
        .sk-burnout {
          display: flex;
          justify-content: center;
          padding: 8px 0;
        }

        /* Risk simple */
        .sk-risk-simple {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0d1b36;
          text-align: center;
          padding: 16px;
        }
      `}</style>
    </>
  );
}
