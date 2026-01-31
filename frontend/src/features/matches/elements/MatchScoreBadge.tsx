import { Badge } from "@/components/elements/Badge";
import { getMatchScoreStyle } from "@/lib/matchScoreTone";

export interface MatchScoreBadgeProps {
  score: number;
  label?: string;
  showLabel?: boolean;
  showEmoji?: boolean;
}

export const MatchScoreBadge = ({
  score,
  label = "Match",
  showLabel = true,
  showEmoji = true,
}: MatchScoreBadgeProps) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const { tone, emoji } = getMatchScoreStyle(clamped);

  const content = showEmoji
    ? showLabel ? `${emoji} ${label} ${clamped}%` : `${emoji} ${clamped}%`
    : showLabel ? `${label} ${clamped}%` : `${clamped}%`;

  return <Badge tone={tone}>{content}</Badge>;
};
