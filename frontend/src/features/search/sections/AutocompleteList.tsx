import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import type { AutocompleteItemProps } from "@/features/search/elements/AutocompleteItem";
import { MapAutocompleteItem } from "@/features/search/lists/MapAutocompleteItem";
import { cx } from "@/lib/classNames";

export interface AutocompleteListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  items: AutocompleteItemProps[];
}

export const AutocompleteList = ({
  className,
  title = "Suggerimenti",
  items,
  ...props
}: AutocompleteListProps) => (
  <Card className={cx("space-y-3 p-4", className)} {...props}>
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
      {title}
    </p>
    <MapAutocompleteItem items={items} />
  </Card>
);
