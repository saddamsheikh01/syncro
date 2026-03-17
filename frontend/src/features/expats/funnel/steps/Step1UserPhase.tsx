"use client";

import { useState } from "react";
import FunnelOptionCard from "../elements/FunnelOptionCard";

const OPTIONS = [
  {
    value: "planning_move",
    label: "I'm Planning My Move",
    image: "/images/onboarding/assests/image%202322.png",
    bg: "#FFF8E8",
  },
  {
    value: "recently_moved",
    label: "I've Recently Moved",
    image: "/images/onboarding/assests/image%202325.png",
    bg: "#FFF3E8",
  },
  {
    value: "already_there",
    label: "I've Been Living Here For A While",
    image: "/images/onboarding/assests/image%202327.png",
    bg: "#EEF4FF",
  },
];

interface Props {
  defaultValue?: string;
  onChange: (value: string) => void;
}

export default function Step1UserPhase({ defaultValue, onChange }: Props) {
  const [selected, setSelected] = useState<string>(defaultValue ?? "");

  const select = (val: string) => {
    setSelected(val);
    onChange(val);
  };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">
        Where Are You In Your Relocation Journey?
      </h1>
      <div className="funnel-cards-row funnel-cards-row--3" style={{ maxWidth: 640 }}>
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
      {/* Shared styles are in ExpatFunnelLayout */}
    </div>
  );
}
