"use client";

import { useT } from "@/hooks";

const ALERT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  OK: { color: "#16a34a", bg: "#dcfce7", label: "OK" },
  WARNING: { color: "#ca8a04", bg: "#fef9c3", label: "Warning" },
  OVER_BUDGET: { color: "#dc2626", bg: "#fee2e2", label: "Over Budget" },
  UNDER_BUDGET: { color: "#2563eb", bg: "#dbeafe", label: "Under Budget" },
};

interface AlertBadgeProps {
  status: string;
}

export default function AlertBadge({ status }: AlertBadgeProps) {
  const { t } = useT();
  const cfg = ALERT_CONFIG[status] ?? ALERT_CONFIG.OK;

  return (
    <>
      <span className="alert-badge" style={{ color: cfg.color, background: cfg.bg }}>
        {t(cfg.label)}
      </span>
      <style>{`
        .alert-badge {
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
