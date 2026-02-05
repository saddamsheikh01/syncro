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
  title = "Match filters",
  subtitle = "Update preferences for affinity.",
  searchPlaceholder = "Search people or interests",
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
}: MatchFilterBarProps) => (
  <Card className={cx("space-y-4 p-5", className)} {...props}>
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
    <Input
      label="Search"
      placeholder={searchPlaceholder}
      value={searchValue}
      onChange={(event) => onSearchChange?.(event.target.value)}
    />
    {sortOptions.length ? (
      <Select
        label="Sort by"
        options={sortOptions}
        defaultValue={defaultSort}
        value={sortValue}
        onValueChange={onSortChange}
        placeholder="Suggested"
      />
    ) : null}
    {typeItems.length ? (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-subtle">Type</p>
        <MapMatchTypeChip items={typeItems} onItemToggle={onTypeToggle} />
      </div>
    ) : null}
    {filterItems.length ? (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-subtle">Quick filters</p>
        <MapTagPillSelectable items={filterItems} onItemToggle={onFilterToggle} />
      </div>
    ) : null}
  </Card>
);
