"use client";

import { useMemo } from "react";
import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import type { SelectOption } from "@/components/elements/Select";
import { Card } from "@/components/elements/Card";
import { useT } from "@/hooks";
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
}: AdminTableToolbarProps) => {
  const { t } = useT();
  const resolvedTitle = title ? t(title) : t("Content management");
  const resolvedSubtitle = subtitle ? t(subtitle) : null;
  const resolvedSearchPlaceholder = searchPlaceholder
    ? t(searchPlaceholder)
    : t("Search by name or ID");
  const resolvedFilterPlaceholder = filterPlaceholder ? t(filterPlaceholder) : t("All");
  const resolvedActionLabel = actionLabel ? t(actionLabel) : null;
  const resolvedFilterOptions = useMemo(
    () =>
      filterOptions.map((option) => ({
        ...option,
        label: t(option.label),
      })),
    [filterOptions, t]
  );

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{resolvedTitle}</h3>
        {resolvedSubtitle ? (
          <p className="text-sm text-muted">{resolvedSubtitle}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input placeholder={resolvedSearchPlaceholder} />
        </div>
        {resolvedFilterOptions.length ? (
          <div className="w-full sm:w-56">
            <Select
              options={resolvedFilterOptions}
              defaultValue={selectedFilter}
              placeholder={resolvedFilterPlaceholder}
            />
          </div>
        ) : null}
        {resolvedActionLabel ? <Button size="sm">{resolvedActionLabel}</Button> : null}
      </div>
    </Card>
  );
};
