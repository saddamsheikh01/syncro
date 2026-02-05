"use client";

import { ExperienceListItem } from "@/features/catalog/cards/ExperienceListItem";
import { cx } from "@/lib/classNames";
import type { AffiliationItem } from "@/features/affiliations/data/affiliations";

export interface AffiliationCardProps {
  item: AffiliationItem;
  className?: string;
}

export const AffiliationCard = ({ item, className }: AffiliationCardProps) => {
  const handleOpen = () => {
    if (!item.ctaUrl) return;
    window.open(item.ctaUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <ExperienceListItem
      className={cx("w-[260px] min-w-[260px] sm:w-[280px] sm:min-w-[280px]", className)}
      title={item.title}
      subtitle={item.subtitle}
      category={item.category}
      priceLabel={item.priceLabel}
      originalPriceLabel={item.originalPriceLabel}
      rating={item.rating}
      reviewCount={item.reviewCount}
      durationLabel={item.durationLabel}
      imageUrl={item.imageUrl}
      provider={item.provider}
      onPress={item.ctaUrl ? handleOpen : undefined}
    />
  );
};
