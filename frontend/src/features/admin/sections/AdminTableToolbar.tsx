import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import type { SelectOption } from "@/components/elements/Select";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface AdminTableToolbarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  filterOptions?: SelectOption[];
  filterPlaceholder?: string;
  selectedFilter?: string;
  actionLabel?: string;
}

export const AdminTableToolbar = ({
  className,
  title = "Content management",
  subtitle = "Filter and manage the available entities.",
  searchPlaceholder = "Search by name or ID",
  filterOptions = [],
  filterPlaceholder = "All",
  selectedFilter,
  actionLabel = "New",
  ...props
}: AdminTableToolbarProps) => (
  <Card className={cx("space-y-4 p-5", className)} {...props}>
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[220px] flex-1">
        <Input placeholder={searchPlaceholder} />
      </div>
      {filterOptions.length ? (
        <div className="w-full sm:w-56">
          <Select
            options={filterOptions}
            defaultValue={selectedFilter}
            placeholder={filterPlaceholder}
          />
        </div>
      ) : null}
      {actionLabel ? (
        <Button size="sm">{actionLabel}</Button>
      ) : null}
    </div>
  </Card>
);
