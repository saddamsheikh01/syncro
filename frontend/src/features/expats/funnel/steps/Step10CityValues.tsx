"use client";

import { useState } from "react";
import FunnelOptionCard from "../elements/FunnelOptionCard";

const OPTIONS = [
  { value: "cost_of_living", label: "Cost Of Living", image: "/images/onboarding/assests/image%202402.png", bg: "#F8FFF8" },
  { value: "social_life", label: "Social Life", image: "/images/onboarding/assests/image%202405.png", bg: "#FFF0F8" },
  { value: "career_opportunities", label: "Career Opportunities", image: "/images/onboarding/assests/image%202404.png", bg: "#FFF8E8" },
  { value: "safety", label: "Safety", image: "/images/onboarding/assests/image%202414.png", bg: "#F0FFF4" },
  { value: "weather", label: "Weather", image: "/images/onboarding/assests/image%202417.png", bg: "#FFFBF0" },
  { value: "culture", label: "Culture", image: "/images/onboarding/assests/image%202416.png", bg: "#F0F8FF" },
];

interface Props {
  defaultValue?: string;
  onChange: (value: string) => void;
}

export default function Step10CityValues({ defaultValue, onChange }: Props) {
  const [selected, setSelected] = useState(defaultValue ?? "");

  const select = (val: string) => { setSelected(val); onChange(val); };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">What Matters Most To You In A City?</h1>
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
