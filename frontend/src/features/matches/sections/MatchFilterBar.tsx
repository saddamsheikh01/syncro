"use client";

import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import type { SelectOption } from "@/components/elements/Select";
import { MapMatchTypeChip } from "@/features/matches/lists/MapMatchTypeChip";
import type { MatchTypeItem } from "@/features/matches/lists/MapMatchTypeChip";
import { MapTagPillSelectable } from "@/features/tags/lists/MapTagPillSelectable";
import type { TagPillSelectableItem } from "@/features/tags/lists/MapTagPillSelectable";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export interface MatchFilterBarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  typeItems?: MatchTypeItem[];
  filterItems?: TagPillSelectableItem[];
  sortOptions?: SelectOption[];
  defaultSort?: string;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  onTypeToggle?: (id: string, nextSelected: boolean) => void;
  onFilterToggle?: (id: string, nextSelected: boolean) => void;
}

export const MatchFilterBar = ({
  className,
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  typeItems = [],
  filterItems = [],
  sortOptions = [],
  defaultSort,
  sortValue,
  onSortChange,
  onTypeToggle,
  onFilterToggle,
  ...props
}: MatchFilterBarProps) => {
  const { t } = useT();

  const resolvedTitle = title ?? t("Match filters");
  const resolvedSubtitle = subtitle ?? t("Update preferences for affinity.");
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? t("Search people or interests");

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">
          {resolvedTitle}
        </h4>
        {resolvedSubtitle ? (
          <p className="text-sm text-muted">{resolvedSubtitle}</p>
        ) : null}
      </div>
      <Input
        label={t("Search")}
        placeholder={resolvedSearchPlaceholder}
        value={searchValue}
        onChange={(event) => onSearchChange?.(event.target.value)}
      />
      {sortOptions.length ? (
        <Select
          label={t("Sort by")}
          options={sortOptions}
          defaultValue={defaultSort}
          value={sortValue}
          onValueChange={onSortChange}
          placeholder={t("Suggested")}
        />
      ) : null}
      {typeItems.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-subtle">{t("Type")}</p>
          <MapMatchTypeChip items={typeItems} onItemToggle={onTypeToggle} />
        </div>
      ) : null}
      {filterItems.length ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-subtle">
            {t("Quick filters")}
          </p>
          <MapTagPillSelectable
            items={filterItems}
            onItemToggle={onFilterToggle}
          />
        </div>
      ) : null}
    </Card>
  );
};
