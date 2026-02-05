"use client";

import { RecommendationRow } from "@/features/home/sections/RecommendationRow";
import { AffiliationCard } from "@/features/affiliations/cards/AffiliationCard";
import type { AffiliationItem } from "@/features/affiliations/data/affiliations";
import { affiliationItems } from "@/features/affiliations/data/affiliations";
import { cx } from "@/lib/classNames";

export interface AffiliationsRowProps {
  id?: string;
  className?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  items?: AffiliationItem[];
}

export const AffiliationsRow = ({
  id,
  className,
  title = "Affiliations",
  subtitle = "Partner-picked stays and experiences with external booking.",
  actionLabel,
  actionHref,
  items = affiliationItems,
}: AffiliationsRowProps) => {
  return (
    <RecommendationRow
      id={id}
      className={cx("space-y-4", className)}
      title={title}
      subtitle={subtitle}
      actionLabel={actionLabel}
      actionHref={actionHref}
    >
      {items.map((item) => (
        <AffiliationCard key={item.id} item={item} />
      ))}
    </RecommendationRow>
  );
};
