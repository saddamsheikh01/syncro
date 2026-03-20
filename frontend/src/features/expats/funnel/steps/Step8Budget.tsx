"use client";

import { useState } from "react";
import FunnelOptionCard from "../elements/FunnelOptionCard";
import type { DesiredLifestyle } from "../../../../types/expats";

const MIN = 300;
const MAX = 10000;

const LIFESTYLE_OPTS: { value: DesiredLifestyle; label: string; image: string; bg: string }[] = [
  { value: "essential", label: "Essential", image: "/images/onboarding/assests/image%202330%20(2).png", bg: "#F0FFF4" },
  { value: "balanced", label: "Balanced", image: "/images/onboarding/assests/image%202331%20(2).png", bg: "#FFF8F0" },
  { value: "comfort", label: "Premium", image: "/images/onboarding/assests/image%202325%20(5).png", bg: "#FDF0FF" },
  { value: "experience", label: "High-Flexibility", image: "/images/onboarding/assests/image%202329%20(1).png", bg: "#FFF0F5" },
];

interface Props {
  defaultBudget?: number;
  defaultLifestyle?: DesiredLifestyle;
  onChange: (data: { monthlyBudget?: number; desiredLifestyle?: DesiredLifestyle }) => void;
}

export default function Step8Budget({ defaultBudget = 2000, defaultLifestyle, onChange }: Props) {
  const [budget, setBudget] = useState(defaultBudget);
  const [lifestyle, setLifestyle] = useState<DesiredLifestyle | "">(defaultLifestyle ?? "");

  const emit = (b = budget, l = lifestyle) => {
    onChange({ monthlyBudget: b, desiredLifestyle: l as DesiredLifestyle || undefined });
  };

  const sliderPct = ((budget - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">What's Your Realistic Monthly Budget?</h1>
      <p className="funnel-step__sub">
        Choose Your Ideal Range. This Helps Us Tailor Recommendations To Your Financial Comfort
      </p>

      <div className="budget-slider-wrap">
        <div className="budget-bubble" style={{ left: `${sliderPct}%`, transform: 'translateX(-50%)' }}>
          € {budget.toLocaleString()}
        </div>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={100}
          value={budget}
          onChange={(e) => { const v = Number(e.target.value); setBudget(v); emit(v); }}
          className="budget-slider"
          style={{ "--pct": `${sliderPct}%` } as React.CSSProperties}
        />
        <div className="budget-range-labels">
          <span>( - € {MIN}</span>
          <span>+ € {MAX.toLocaleString()}</span>
        </div>
      </div>

      <div className="lifestyle-section">
        <p className="work-field-label" style={{ marginBottom: 20 }}>How Would You Describe Your Lifestyle?</p>
        <div className="funnel-cards-row funnel-cards-row--4" style={{ maxWidth: 900, width: '100%' }}>
          {LIFESTYLE_OPTS.map((opt) => (
            <FunnelOptionCard
              key={opt.value}
              image={opt.image}
              label={opt.label}
              selected={lifestyle === opt.value}
              bg={opt.bg}
              onClick={() => { setLifestyle(opt.value); emit(budget, opt.value); }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .budget-slider-wrap {
          width: 100%; max-width: 640px;
          margin-bottom: 40px;
          position: relative;
          padding-top: 40px;
        }
        .budget-bubble {
          position: absolute;
          top: 0;
          background: #3b6bdc;
          color: #fff;
          border-radius: 8px;
          padding: 4px 12px;
          font-size: 0.9rem;
          font-weight: 700;
          white-space: nowrap;
          transform: translateX(-50%);
          transition: left 0.05s;
        }
        .budget-bubble::after {
          content: '';
          position: absolute; bottom: -6px; left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #3b6bdc;
          border-bottom: none;
        }
        .budget-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%; height: 6px;
          border-radius: 50px;
          outline: none; cursor: pointer;
          background: linear-gradient(90deg, #3b6bdc 0% var(--pct), #e4e9f2 var(--pct) 100%);
        }
        .budget-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #3b6bdc;
          box-shadow: 0 2px 8px rgba(59,107,220,0.3);
          cursor: pointer;
        }
        .budget-range-labels {
          display: flex; justify-content: space-between;
          font-size: 0.85rem; color: #6c778a; margin-top: 8px;
        }
        .lifestyle-section { width: 100%; max-width: 900px; }
        .work-field-label { font-size: 1rem; font-weight: 700; color: #0d1b36; text-align: left; display: block; }
      `}</style>
    </div>
  );
}
