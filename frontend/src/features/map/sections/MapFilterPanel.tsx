"use client";

import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import type { SelectOption } from "@/components/elements/Select";
import { MapFilterChip } from "@/features/map/lists/MapFilterChip";
import type { FilterChipItem } from "@/features/map/lists/MapFilterChip";
import { cx } from "@/lib/classNames";

export interface MapFilterPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  categoryOptions?: SelectOption[];
  distanceOptions?: SelectOption[];
  defaultCategory?: string;
  defaultDistance?: string;
  filters?: FilterChipItem[];
  onFilterToggle?: (id: string, nextSelected: boolean) => void;
  actionLabel?: string;
  onActionClick?: () => void;
  showAction?: boolean;
}

export const MapFilterPanel = ({
  className,
  title = "Filtri mappa",
  subtitle = "Affina i risultati vicino a te.",
  searchPlaceholder = "Cerca un luogo o un quartiere",
  categoryOptions = [],
  distanceOptions = [],
  defaultCategory,
  defaultDistance,
  filters = [],
  onFilterToggle,
  actionLabel = "Applica filtri",
  onActionClick,
  showAction = true,
  ...props
}: MapFilterPanelProps) => (
  <Card className={cx("space-y-4 p-5", className)} {...props}>
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
    <Input label="Ricerca" placeholder={searchPlaceholder} />
    <div className="grid gap-3 sm:grid-cols-2">
      <Select
        label="Categoria"
        options={categoryOptions}
        defaultValue={defaultCategory}
        placeholder="Tutte"
      />
      <Select
        label="Distanza"
        options={distanceOptions}
        defaultValue={defaultDistance}
        placeholder="Qualsiasi"
      />
    </div>
    {filters.length ? (
      <MapFilterChip items={filters} onItemToggle={onFilterToggle} />
    ) : null}
    {showAction ? (
      <Button size="sm" variant="secondary" onClick={onActionClick}>
        {actionLabel}
      </Button>
    ) : null}
  </Card>
);
