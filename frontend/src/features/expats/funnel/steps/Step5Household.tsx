"use client";

import { useState } from "react";
import FunnelOptionCard from "../elements/FunnelOptionCard";
import type { Household } from "../../../../types/expats";

const HOUSEHOLD_OPTS = [
  { value: "alone", label: "Alone", image: "/images/onboarding/assests/image%202322%20(2).png", bg: "#FFF8F0" },
  { value: "with_partner", label: "With Partner", image: "/images/onboarding/assests/image%202325%20(3).png", bg: "#FFF0F8" },
  { value: "with_children", label: "With Children", image: "/images/onboarding/assests/image%202327%20(2).png", bg: "#F0FFF4" },
];

interface Props {
  defaultHousehold?: Household;
  defaultHasPets?: boolean;
  defaultChildrenCount?: number;
  defaultChildrenAgeRange?: string;
  onChange: (data: { household?: Household; hasPets?: boolean; childrenCount?: number; childrenAgeRange?: string }) => void;
}

export default function Step5Household({
  defaultHousehold,
  defaultHasPets = false,
  defaultChildrenCount,
  defaultChildrenAgeRange,
  onChange,
}: Props) {
  const [household, setHousehold] = useState<Household | "">(defaultHousehold ?? "");
  const [hasPets, setHasPets] = useState(defaultHasPets);
  const [childrenCount, setChildrenCount] = useState(defaultChildrenCount ?? 0);
  const [childrenAgeRange, setChildrenAgeRange] = useState(defaultChildrenAgeRange ?? "");

  const emit = (h = household, p = hasPets, cc = childrenCount, car = childrenAgeRange) => {
    onChange({ household: h as Household || undefined, hasPets: p, childrenCount: cc, childrenAgeRange: car });
  };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">Who's In Your Household?</h1>
      <p className="funnel-step__sub">This Affects Housing Strategy, Budget And Local Integration</p>
      <div className="funnel-cards-row funnel-cards-row--3">
        {HOUSEHOLD_OPTS.map((opt) => (
          <FunnelOptionCard
            key={opt.value}
            image={opt.image}
            label={opt.label}
            selected={household === opt.value}
            bg={opt.bg}
            onClick={() => { setHousehold(opt.value as Household); emit(opt.value as Household); }}
          />
        ))}
      </div>

      {household === "with_children" && (
        <div className="household-extra">
          <div className="household-field">
            <label className="household-field__label">Number Of Children</label>
            <div className="household-field__input-wrap">
              <span>👶</span>
              <input
                type="number"
                min={1}
                max={10}
                value={childrenCount || ""}
                placeholder="2"
                onChange={(e) => { const v = Number(e.target.value); setChildrenCount(v); emit(household, hasPets, v); }}
                className="household-input"
              />
            </div>
          </div>
          <div className="household-field">
            <label className="household-field__label">Age Range Of Children</label>
            <div className="household-field__input-wrap">
              <span>📊</span>
              <input
                type="text"
                placeholder="e.g. 3"
                value={childrenAgeRange}
                onChange={(e) => { setChildrenAgeRange(e.target.value); emit(household, hasPets, childrenCount, e.target.value); }}
                className="household-input"
              />
            </div>
          </div>
        </div>
      )}

      <div className="pets-row">
        <img src="/images/onboarding/assests/image%202328.png" alt="Pets" className="pets-row__img" />
        <span className="pets-row__label">I Have Pets</span>
        <button
          onClick={() => { const next = !hasPets; setHasPets(next); emit(household, next); }}
          className={`toggle ${hasPets ? "toggle--on" : ""}`}
          aria-label="I have pets"
        >
          <div className="toggle__thumb" />
        </button>
      </div>

      <style>{`
        .household-extra {
          display: flex; gap: 24px; margin-top: 24px; flex-wrap: wrap;
          width: 100%; max-width: 540px;
        }
        .household-field { flex: 1; min-width: 160px; }
        .household-field__label { font-size: 0.875rem; font-weight: 600; color: #1a2433; margin-bottom: 8px; display: block; }
        .household-field__input-wrap {
          display: flex; align-items: center; gap: 10px;
          border: 1.5px solid #d5ddea; border-radius: 10px;
          padding: 10px 14px; background: #fff;
        }
        .household-input {
          border: none; outline: none; font-size: 0.95rem;
          color: #1a2433; width: 100%; font-family: inherit;
        }
        .pets-row {
          display: flex; align-items: center; gap: 12px;
          border: 1.5px solid #e4e9f2; border-radius: 12px;
          padding: 14px 20px; margin-top: 16px;
          background: #fff; max-width: 540px; width: 100%;
        }
        .pets-row__img { width: 40px; height: 40px; object-fit: contain; }
        .pets-row__label { font-size: 0.95rem; font-weight: 600; color: #1a2433; flex: 1; }
        .toggle {
          width: 48px; height: 26px; border-radius: 50px;
          background: #d5ddea; border: none; cursor: pointer;
          position: relative; transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle--on { background: #3b6bdc; }
        .toggle__thumb {
          position: absolute; top: 3px; left: 3px;
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; transition: transform 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .toggle--on .toggle__thumb { transform: translateX(22px); }
      `}</style>
    </div>
  );
}
