import type { BadgeTone } from "@/components/elements/Badge";
import { Badge } from "@/components/elements/Badge";

export interface DistanceBadgeProps {
  distanceKm: number;
  tone?: BadgeTone;
}

const formatDistance = (distanceKm: number) => {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
};

export const DistanceBadge = ({ distanceKm, tone = "neutral" }: DistanceBadgeProps) => (
  <Badge tone={tone}>{formatDistance(distanceKm)}</Badge>
);
