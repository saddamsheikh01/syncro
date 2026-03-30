"use client";

interface ProjectionPoint {
  month: number;
  monthlySaving: number;
  cumulativeSavings: number;
}

interface ProjectionChartProps {
  projections: ProjectionPoint[];
  width?: number;
  height?: number;
}

export default function ProjectionChart({ projections, width = 480, height = 200 }: ProjectionChartProps) {
  if (!projections || projections.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 36, left: 56 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;

  const maxVal = Math.max(...projections.map((p) => p.cumulativeSavings), 1);
  const minVal = Math.min(...projections.map((p) => p.cumulativeSavings), 0);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => padding.left + (i / Math.max(projections.length - 1, 1)) * w;
  const toY = (val: number) => padding.top + h - ((val - minVal) / range) * h;

  const linePath = projections
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.cumulativeSavings)}`)
    .join(" ");

  const areaPath = `${linePath} L ${toX(projections.length - 1)} ${toY(minVal)} L ${toX(0)} ${toY(minVal)} Z`;

  const gridLines = 4;
  const gridStep = range / gridLines;

  return (
    <div className="projection-chart">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const val = minVal + gridStep * i;
          const y = toY(val);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="rgba(59, 107, 220, 0.08)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b6bdc" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Dots */}
        {projections.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.cumulativeSavings)} r={4} fill="#3b6bdc" stroke="#fff" strokeWidth={2} />
        ))}

        {/* X-axis labels */}
        {projections.map((p, i) => (
          <text key={i} x={toX(i)} y={height - 8} textAnchor="middle" fontSize={10} fill="#9ca3af">
            M{p.month}
          </text>
        ))}
      </svg>
      <style>{`
        .projection-chart {
          width: 100%;
          overflow-x: auto;
        }
        .projection-chart svg {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}
