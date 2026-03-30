"use client";

interface StressGaugeProps {
  /** Value between 0 and 1. */
  value: number;
  /** Diameter of the gauge. */
  size?: number;
  label?: string;
}

const LEVEL_COLORS: [number, string][] = [
  [0.3, "#16a34a"],
  [0.5, "#ca8a04"],
  [0.7, "#ea580c"],
  [1.0, "#dc2626"],
];

function getColor(value: number): string {
  for (const [threshold, color] of LEVEL_COLORS) {
    if (value <= threshold) return color;
  }
  return "#dc2626";
}

export default function StressGauge({ value, size = 160, label }: StressGaugeProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const color = getColor(clamped);
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size * 0.38;
  const strokeWidth = size * 0.08;
  const circumference = Math.PI * r;
  const dashOffset = circumference * (1 - clamped);

  const startX = cx - r;
  const endX = cx + r;

  return (
    <div className="stress-gauge">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc */}
        <path
          d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
        />
        {/* Value text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={size * 0.18} fontWeight="800" fill={color}>
          {(clamped * 100).toFixed(0)}%
        </text>
        {label && (
          <text x={cx} y={cy + size * 0.08} textAnchor="middle" fontSize={size * 0.08} fill="#6b7280">
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
