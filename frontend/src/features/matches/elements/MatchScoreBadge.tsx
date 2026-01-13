import type { BadgeTone } from "@/components/elements/Badge";
import { Badge } from "@/components/elements/Badge";

export interface MatchScoreBadgeProps {
  score: number;
  label?: string;
  showLabel?: boolean;
}

const getTone = (score: number): BadgeTone => {
  if (score >= 80) return "success";
  if (score >= 65) return "accent";
  if (score >= 50) return "warning";
  return "danger";
};

export const MatchScoreBadge = ({
  score,
  label = "Match",
  showLabel = true,
}: MatchScoreBadgeProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tone = getTone(clamped);

  return (
    <Badge tone={tone}>
      {showLabel ? `${label} ${clamped}%` : `${clamped}%`}
    </Badge>
  );
};
