"use client";

import { useState } from "react";
import FunnelOptionCard from "../elements/FunnelOptionCard";
import type { PriorityProblem } from "../../../../types/expats";

const OPTIONS: { value: PriorityProblem; label: string; image: string; bg: string }[] = [
  { value: "housing", label: "Find The Right Housing", image: "/images/onboarding/assests/image%202330%20(3).png", bg: "#FFF8E8" },
  { value: "cost_of_living", label: "Clarify Real Monthly Cost", image: "/images/onboarding/assests/image%202402.png", bg: "#E8FFF0" },
  { value: "professional_network", label: "Expand My Professional Network", image: "/images/onboarding/assests/image%202329%20(2).png", bg: "#FFF0E8" },
  { value: "neighborhood", label: "Choosing The Right Neighborhood", image: "/images/onboarding/assests/image%202331%20(3).png", bg: "#E8F0FF" },
  { value: "friendships", label: "Making New Friends", image: "/images/onboarding/assests/image%202338.png", bg: "#F8EEFF" },
  { value: "schools_family", label: "School & Family Setup", image: "/images/onboarding/assests/image%202339.png", bg: "#FFF8E8" },
  { value: "bureaucracy", label: "Legal & Paperwork", image: "/images/onboarding/assests/image%202337.png", bg: "#F8F8F8" },
  { value: "career_opportunities", label: "Career Opportunities", image: "/images/onboarding/assests/image%202336.png", bg: "#FFF0E8" },
];

interface Props {
  defaultValue?: PriorityProblem;
  onChange: (value: PriorityProblem) => void;
}

export default function Step9Priority({ defaultValue, onChange }: Props) {
  const [selected, setSelected] = useState<PriorityProblem | "">(defaultValue ?? "");

  const select = (val: PriorityProblem) => { setSelected(val); onChange(val); };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">What Do You Need To Fix First?</h1>
      <p className="funnel-step__sub">Please Select The Areas You Need To Tackle First</p>
      <div className="funnel-cards-row funnel-cards-row--8" style={{ maxWidth: 900, width: '100%' }}>
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
