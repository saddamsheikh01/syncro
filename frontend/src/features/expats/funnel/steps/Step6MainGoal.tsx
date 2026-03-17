"use client";

import { useState } from "react";
import FunnelOptionCard from "../elements/FunnelOptionCard";
import type { PrimaryGoal } from "../../../../types/expats";

const OPTIONS: { value: PrimaryGoal; label: string; image: string; bg: string }[] = [
  { value: "career_growth", label: "Career Growth", image: "/images/onboarding/assests/image%202354.png", bg: "#FFF0F5" },
  { value: "remote_work", label: "Remote Flexibility", image: "/images/onboarding/assests/image%202357.png", bg: "#FFF8F0" },
  { value: "study", label: "Education", image: "/images/onboarding/assests/image%202356.png", bg: "#EEF4FF" },
  { value: "lifestyle", label: "Lifestyle Upgrade", image: "/images/onboarding/assests/image%202322%20(2).png", bg: "#FAFAF8" },
  { value: "family_stability", label: "Family Stability", image: "/images/onboarding/assests/image%202325%20(3).png", bg: "#FFF8E8" },
  { value: "personal_reset", label: "Personal Reset", image: "/images/onboarding/assests/Group%201686559597.png", bg: "#F0FFF4" },
];

interface Props {
  defaultValue?: PrimaryGoal;
  onChange: (value: PrimaryGoal) => void;
}

export default function Step6MainGoal({ defaultValue, onChange }: Props) {
  const [selected, setSelected] = useState<PrimaryGoal | "">(defaultValue ?? "");

  const select = (val: PrimaryGoal) => { setSelected(val); onChange(val); };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">What's Your Main Goal Right Now?</h1>
      <p className="funnel-step__sub">Choose The Main Reason For Your Move</p>
      <div className="funnel-cards-row funnel-cards-row--6" style={{ maxWidth: 900, width: '100%' }}>
        {OPTIONS.map((opt) => (
          <FunnelOptionCard
            key={opt.value}
            image={opt.image}
            label={opt.label}
            selected={selected === opt.value}
            bg={opt.bg}
            onClick={() => select(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}
