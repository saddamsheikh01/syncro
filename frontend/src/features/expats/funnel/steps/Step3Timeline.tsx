"use client";

import { useState } from "react";
import FunnelOptionCard from "../elements/FunnelOptionCard";

const PLANNING_OPTIONS = [
  { value: "within_3_months", label: "Within 3 Months", image: "/images/onboarding/assests/image%202330.png", bg: "#EFFFEE" },
  { value: "3_6_months", label: "3–6 Months", image: "/images/onboarding/assests/image%202331.png", bg: "#EEF4FF" },
  { value: "6_12_months", label: "6–12 Months", image: "/images/onboarding/assests/image%202325%20(2).png", bg: "#FFF0F5" },
  { value: "exploring", label: "Exploring Options", image: "/images/onboarding/assests/image%202329.png", bg: "#F8FAFD" },
];

const ALREADY_OPTIONS = [
  { value: "less_3_months", label: "Less Than 3 Months", sublabel: "Still Settling In", image: "/images/onboarding/assests/image%202330.png", bg: "#F0FAF0" },
  { value: "3_12_months", label: "3–12 Months", sublabel: "Building Your Base", image: "/images/onboarding/assests/image%202331.png", bg: "#EEF4FF" },
  { value: "1_2_years", label: "1–2 Years", sublabel: "Stabilizing", image: "/images/onboarding/assests/image%202325%20(2).png", bg: "#FFFBE8" },
  { value: "2_plus", label: "More Than 2 Years", sublabel: "Established Locally", image: "/images/onboarding/assests/image%202331%20(3).png", bg: "#FFF0F8" },
];

interface Props {
  userPhase?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
}

export default function Step3Timeline({ userPhase = "planning_move", defaultValue, onChange }: Props) {
  const [selected, setSelected] = useState(defaultValue ?? "");
  const isAlready = userPhase === "already_there";
  const opts = isAlready ? ALREADY_OPTIONS : PLANNING_OPTIONS;

  const title = isAlready
    ? "How Long Have You Been Living Here?"
    : "When Are You Planning To Relocate?";

  const select = (val: string) => { setSelected(val); onChange(val); };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">{title}</h1>
      <div className="funnel-cards-row funnel-cards-row--4">
        {opts.map((opt) => (
          <FunnelOptionCard
            key={opt.value}
            image={opt.image}
            label={opt.label}
            sublabel={(opt as { sublabel?: string }).sublabel}
            selected={selected === opt.value}
            bg={opt.bg}
            onClick={() => select(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}
