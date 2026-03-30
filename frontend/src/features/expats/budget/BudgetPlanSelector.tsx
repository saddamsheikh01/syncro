"use client";

import { useT } from "@/hooks";

interface BudgetPlanSelectorProps {
  selected: string;
  onSelect: (plan: string) => void;
}

const PLANS = [
  {
    code: "FREE",
    icon: "🆓",
    titleKey: "Free",
    descKey: "Quick estimate with 3 parameters",
    features: ["Monthly cost estimate", "Margin status", "Sustainability check"],
    locked: false,
  },
  {
    code: "PREMIUM",
    icon: "⭐",
    titleKey: "Premium",
    descKey: "Advanced analysis with stress index",
    features: ["Stress Index gauge", "Cost breakdown", "Stability score"],
    locked: true,
  },
  {
    code: "SUPER_PRO",
    icon: "🚀",
    titleKey: "Super Pro",
    descKey: "Full projections and optimization plan",
    features: ["6/12/24 month projections", "Optimization plan", "Relocation safety plan"],
    locked: true,
  },
];

export default function BudgetPlanSelector({ selected, onSelect }: BudgetPlanSelectorProps) {
  const { t } = useT();

  return (
    <>
      <div className="plan-selector">
        {PLANS.map((plan) => {
          const isActive = selected === plan.code;
          return (
            <button
              key={plan.code}
              className={`plan-card ${isActive ? "plan-card--active" : ""} ${plan.locked ? "plan-card--locked" : ""}`}
              onClick={() => { if (!plan.locked) onSelect(plan.code); }}
              type="button"
              disabled={plan.locked}
            >
              {plan.locked && <span className="plan-card__coming">{t("Coming Soon")}</span>}
              <span className="plan-card__icon">{plan.icon}</span>
              <h3 className="plan-card__title">
                {t(plan.titleKey)}
                {plan.locked && <span className="plan-card__lock">🔒</span>}
              </h3>
              <p className="plan-card__desc">{t(plan.descKey)}</p>
              <ul className="plan-card__features">
                {plan.features.map((f) => (
                  <li key={f}>{t(f)}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
      <style>{`
        .plan-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (max-width: 768px) {
          .plan-selector {
            grid-template-columns: 1fr;
          }
        }
        .plan-card {
          background: #fff;
          border: 2px solid #e4e9f2;
          border-radius: 16px;
          padding: 24px 20px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .plan-card:hover:not(:disabled) {
          border-color: #3b6bdc;
          box-shadow: 0 4px 20px rgba(59, 107, 220, 0.1);
        }
        .plan-card--active {
          border-color: #3b6bdc;
          background: #f0f4ff;
          box-shadow: 0 4px 20px rgba(59, 107, 220, 0.12);
        }
        .plan-card--locked {
          opacity: 0.55;
          cursor: not-allowed;
          border-color: #e4e9f2;
        }
        .plan-card--locked:hover {
          border-color: #e4e9f2;
          box-shadow: none;
        }
        .plan-card__coming {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 3px 10px;
          border-radius: 8px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: #fef9c3;
          color: #a16207;
        }
        .plan-card__icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 12px;
        }
        .plan-card__title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0d1b36;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .plan-card__lock {
          font-size: 0.875rem;
        }
        .plan-card__desc {
          font-size: 0.8125rem;
          color: #6c778a;
          margin-bottom: 16px;
          line-height: 1.4;
        }
        .plan-card__features {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .plan-card__features li {
          font-size: 0.8125rem;
          color: #475569;
          padding: 3px 0;
          padding-left: 18px;
          position: relative;
        }
        .plan-card__features li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #16a34a;
          font-weight: 700;
        }
        .plan-card--locked .plan-card__features li::before {
          color: #b0bcd4;
        }
      `}</style>
    </>
  );
}
