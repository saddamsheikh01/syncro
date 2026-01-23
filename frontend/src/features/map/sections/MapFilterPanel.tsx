"use client";

import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import type { SelectOption } from "@/components/elements/Select";
import { PlacesAutocomplete } from "@/components/elements/PlacesAutocomplete";
import type { PlaceResult } from "@/components/elements/PlacesAutocomplete";
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
  onCategoryChange?: (value: string | null) => void;
  onDistanceChange?: (value: string | null) => void;
  onSearchChange?: (value: string) => void;
  // Autocomplete Google
  useAutocomplete?: boolean;
  onPlaceSelect?: (place: PlaceResult) => void;
  onAutocompleteClear?: () => void;
  userPosition?: { latitude: number; longitude: number } | null;
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
  onCategoryChange,
  onDistanceChange,
  onSearchChange,
  useAutocomplete = true,
  onPlaceSelect,
  onAutocompleteClear,
  userPosition,
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
    {useAutocomplete ? (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-muted">Ricerca</label>
        <PlacesAutocomplete
          placeholder={searchPlaceholder}
          onPlaceSelect={onPlaceSelect}
          onClear={onAutocompleteClear}
          locationBias={
            userPosition
              ? {
                  lat: userPosition.latitude,
                  lng: userPosition.longitude,
                  radius: 50000,
                }
              : undefined
          }
        />
      </div>
    ) : (
      <Input
        label="Ricerca"
        placeholder={searchPlaceholder}
        onChange={(e) => onSearchChange?.(e.target.value)}
      />
    )}
    <div className="grid gap-3 sm:grid-cols-2">
      <Select
        label="Categoria"
        options={categoryOptions}
        defaultValue={defaultCategory}
        placeholder="Tutte"
        onValueChange={(val) => onCategoryChange?.(val || null)}
      />
      <Select
        label="Distanza"
        options={distanceOptions}
        defaultValue={defaultDistance}
        placeholder="Qualsiasi"
        onValueChange={(val) => onDistanceChange?.(val || null)}
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
