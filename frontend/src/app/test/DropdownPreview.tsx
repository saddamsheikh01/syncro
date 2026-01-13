"use client";

import { useState } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { Tag } from "@/components/elements/Tag";

const ITEMS = [
  { id: "coffee", label: "Coffee" },
  { id: "lunch", label: "Lunch" },
  { id: "work", label: "Work", description: "Focus time" },
];

export const DropdownPreview = () => {
  const [selection, setSelection] = useState("Nessuna");

  const handleSelect = (id: string) => {
    const label = ITEMS.find((item) => item.id === id)?.label ?? id;
    setSelection(label);
  };

  return (
    <div className="space-y-3">
      <Dropdown label="Seleziona" items={ITEMS} onSelect={handleSelect} />
      <Tag tone="accent">Selezione: {selection}</Tag>
    </div>
  );
};
