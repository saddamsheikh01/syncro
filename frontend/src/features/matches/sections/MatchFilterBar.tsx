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
  typeItems?: MatchTypeItem[];
  filterItems?: TagPillSelectableItem[];
  sortOptions?: SelectOption[];
  defaultSort?: string;
}

export const MatchFilterBar = ({
  className,
  title = "Filtri match",
  subtitle = "Aggiorna le preferenze per affinita.",
  searchPlaceholder = "Cerca persone o interessi",
  typeItems = [],
  filterItems = [],
  sortOptions = [],
  defaultSort,
  ...props
}: MatchFilterBarProps) => (
  <Card className={cx("space-y-4 p-5", className)} {...props}>
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
    <Input label="Ricerca" placeholder={searchPlaceholder} />
    {sortOptions.length ? (
      <Select
        label="Ordina per"
        options={sortOptions}
        defaultValue={defaultSort}
        placeholder="Suggeriti"
      />
    ) : null}
    {typeItems.length ? (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-subtle">Tipologia</p>
        <MapMatchTypeChip items={typeItems} />
      </div>
    ) : null}
    {filterItems.length ? (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-subtle">Filtri rapidi</p>
        <MapTagPillSelectable items={filterItems} />
      </div>
    ) : null}
  </Card>
);
