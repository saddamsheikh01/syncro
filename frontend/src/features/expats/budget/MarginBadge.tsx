"use client";

import { useT } from "@/hooks";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  sustainable: { color: "#16a34a", bg: "#dcfce7", label: "Sustainable" },
  tight: { color: "#ca8a04", bg: "#fef9c3", label: "Tight" },
  very_tight: { color: "#ea580c", bg: "#ffedd5", label: "Very Tight" },
  unsustainable: { color: "#dc2626", bg: "#fee2e2", label: "Unsustainable" },
};

interface MarginBadgeProps {
  status: string;
}

export default function MarginBadge({ status }: MarginBadgeProps) {
  const { t } = useT();
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.sustainable;

  return (
    <>
      <span className="margin-badge" style={{ color: cfg.color, background: cfg.bg }}>
        {t(cfg.label)}
      </span>
      <style>{`
        .margin-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>
    </>
  );
}
