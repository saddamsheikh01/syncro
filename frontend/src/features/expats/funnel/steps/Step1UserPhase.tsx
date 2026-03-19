"use client";

import { useState } from "react";
import { useT } from "@/hooks";
import FunnelOptionCard from "../elements/FunnelOptionCard";

const OPTIONS = [
  { value: "planning_move", labelKey: "Expats.funnel.step1.planning", image: "/images/onboarding/assests/image%202322.png", bg: "#FFF8E8" },
  { value: "recently_moved", labelKey: "Expats.funnel.step1.recently", image: "/images/onboarding/assests/image%202325.png", bg: "#FFF3E8" },
  { value: "already_there", labelKey: "Expats.funnel.step1.already", image: "/images/onboarding/assests/image%202327.png", bg: "#EEF4FF" },
];

interface Props {
  defaultValue?: string;
  onChange: (value: string) => void;
}

export default function Step1UserPhase({ defaultValue, onChange }: Props) {
  const { t } = useT();
  const [selected, setSelected] = useState<string>(defaultValue ?? "");

  const select = (val: string) => {
    setSelected(val);
    onChange(val);
  };

  return (
    <div className="funnel-step">
      <h1 className="funnel-step__title">
        {t("Expats.funnel.step1.title")}
      </h1>
      <div className="funnel-cards-row funnel-cards-row--3" style={{ maxWidth: 640 }}>
        {OPTIONS.map((opt) => (
          <FunnelOptionCard
            key={opt.value}
            image={opt.image}
            label={t(opt.labelKey)}
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
