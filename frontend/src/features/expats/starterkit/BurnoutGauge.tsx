"use client";

interface BurnoutGaugeProps {
  /** Value between 0 and 100. */
  value: number;
  size?: number;
  label?: string;
}

const LEVEL_CONFIG: [number, string, string][] = [
  [30, "#16a34a", "LOW"],
  [50, "#ca8a04", "MODERATE"],
  [70, "#ea580c", "HIGH"],
  [100, "#dc2626", "CRITICAL"],
];

function getConfig(value: number): { color: string; level: string } {
  for (const [threshold, color, level] of LEVEL_CONFIG) {
    if (value < threshold) return { color, level };
  }
  return { color: "#dc2626", level: "CRITICAL" };
}

export default function BurnoutGauge({ value, size = 140, label }: BurnoutGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const { color, level } = getConfig(clamped);
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className="burnout-gauge">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.07} />
        {/* Value arc */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
        {/* Value text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.2} fontWeight="800" fill={color}>
          {clamped}
        </text>
        <text x={cx} y={cy + size * 0.12} textAnchor="middle" fontSize={size * 0.085} fill="#6b7280">
          {label ?? level}
        </text>
      </svg>
    </div>
  );
}
