import { Badge, type BadgeSize } from "@/components/elements/Badge";
import { getMatchScoreStyle } from "@/lib/matchScoreTone";

export interface MatchScoreBadgeProps {
  score: number;
  label?: string;
  showLabel?: boolean;
  showEmoji?: boolean;
  size?: BadgeSize;
}

export const MatchScoreBadge = ({
  score,
  label = "Match",
  showLabel = true,
  showEmoji = true,
  size = "md",
}: MatchScoreBadgeProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const { tone, emoji } = getMatchScoreStyle(clamped);

  const content = showEmoji
    ? showLabel ? `${emoji} ${label} ${clamped}%` : `${emoji} ${clamped}%`
    : showLabel ? `${label} ${clamped}%` : `${clamped}%`;

  return <Badge tone={tone} size={size}>{content}</Badge>;
};
