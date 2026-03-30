"use client";

interface ScoreBarProps {
  /** Value 0–100. */
  value: number;
  /** Max value for the bar scale. Default 100. */
  max?: number;
}

function getBarColor(value: number): string {
  if (value >= 70) return "#22c55e";
  if (value >= 50) return "#f59e0b";
  if (value >= 30) return "#f97316";
  return "#ef4444";
}

export default function ScoreBar({ value, max = 100 }: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = getBarColor(value);

  return (
    <>
      <div className="score-bar">
        <div className="score-bar__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <style>{`
        .score-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .score-bar__fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
      `}</style>
    </>
  );
}
