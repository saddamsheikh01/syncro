"use client";

interface RadarData {
  label: string;
  value: number; // 0–100
  shortLabel: string;
}

interface Props {
  data: RadarData[];
  size?: number;
  color?: string;
}

export default function RadarChart({ data, size = 220, color = "#3b6bdc" }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const n = data.length;

  const toXY = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const radius = (value / 100) * r;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const gridLevels = [20, 40, 60, 80, 100];

  const gridPath = (level: number) => {
    const pts = Array.from({ length: n }, (_, i) => toXY(i, level));
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  };

  const dataPath = () => {
    const pts = data.map((d, i) => toXY(i, d.value));
    return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  };

  const axisEnd = (index: number) => toXY(index, 100);

  const labelPos = (index: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const labelR = r + 26;
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
    };
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid polygons */}
      {gridLevels.map((level) => (
        <path
          key={level}
          d={gridPath(level)}
          fill="none"
          stroke="#e4e9f2"
          strokeWidth={1}
        />
      ))}

      {/* Axis lines */}
      {data.map((_, i) => {
        const end = axisEnd(i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={end.x} y2={end.y}
            stroke="#e4e9f2"
            strokeWidth={1}
          />
        );
      })}

      {/* Data polygon */}
      <path
        d={dataPath()}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((d, i) => {
        const pt = toXY(i, d.value);
        return <circle key={i} cx={pt.x} cy={pt.y} r={4} fill={color} />;
      })}

      {/* Labels with value */}
      {data.map((d, i) => {
        const lp = labelPos(i);
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontWeight={700}
            fill="#0d1b36"
          >
            <tspan x={lp.x} dy="-7">{d.value}%</tspan>
            <tspan x={lp.x} dy="14" fontSize={8} fill="#6c778a">{d.shortLabel}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
