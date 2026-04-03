"use client";

import { useT } from "@/hooks";
import type { RegistrationGateContext } from "@/hooks/expats/useRegistrationGate";

interface PlanTabsProps {
  onLockedClick?: (context: RegistrationGateContext) => void;
}

const PLANS = [
  { code: "FREE", label: "Free", locked: false, gateContext: null },
  { code: "PREMIUM", label: "Premium", locked: true, gateContext: "premium_plan" as RegistrationGateContext },
  { code: "SUPER_PRO", label: "Super Pro", locked: true, gateContext: "super_pro_plan" as RegistrationGateContext },
];

export default function PlanTabs({ onLockedClick }: PlanTabsProps) {
  const { t } = useT();

  const handleClick = (plan: typeof PLANS[number]) => {
    if (plan.locked && plan.gateContext && onLockedClick) {
      onLockedClick(plan.gateContext);
    }
  };

  return (
    <>
      <div className="plan-tabs">
        {PLANS.map((plan) => (
          <button
            key={plan.code}
            className={`plan-tabs__tab ${!plan.locked ? "plan-tabs__tab--active" : "plan-tabs__tab--locked"}`}
            type="button"
            onClick={() => handleClick(plan)}
          >
            {t(plan.label)}
            {plan.locked && (
              <span className="plan-tabs__lock">🔒 {t("Coming Soon")}</span>
            )}
          </button>
        ))}
      </div>
      <style>{`
        .plan-tabs {
          display: flex;
          gap: 4px;
          background: #fff;
          border: 1px solid #e4e9f2;
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 24px;
        }
        .plan-tabs__tab {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 11px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          color: #6c778a;
        }
        .plan-tabs__tab--active {
          background: #3b6bdc;
          color: #fff;
          cursor: default;
        }
        .plan-tabs__tab--locked {
          opacity: 0.7;
          cursor: pointer;
        }
        .plan-tabs__tab--locked:hover {
          background: rgba(59, 107, 220, 0.08);
        }
        .plan-tabs__lock {
          font-size: 0.625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          background: rgba(254, 249, 195, 0.8);
          color: #a16207;
          padding: 2px 6px;
          border-radius: 5px;
          white-space: nowrap;
        }
        .plan-tabs__tab--active .plan-tabs__lock {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        @media (max-width: 640px) {
          .plan-tabs {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
