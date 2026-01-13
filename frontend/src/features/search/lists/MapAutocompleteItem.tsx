import { cx } from "@/lib/classNames";
import type { AutocompleteItemProps } from "../elements/AutocompleteItem";
import { AutocompleteItem } from "../elements/AutocompleteItem";

export interface MapAutocompleteItemProps {
  className?: string;
  items: AutocompleteItemProps[];
}

export const MapAutocompleteItem = ({
  className,
  items,
}: MapAutocompleteItemProps) => (
  <div className={cx("divide-y divide-border/60", className)}>
    {items.map((item, index) => (
      <AutocompleteItem key={`${item.title}-${index}`} {...item} />
    ))}
  </div>
);
