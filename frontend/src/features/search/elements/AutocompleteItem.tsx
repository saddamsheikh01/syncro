"use client";

import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";
import { useT } from "@/hooks";

export type AutocompleteType = "USER" | "PLACE";

export interface AutocompleteItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  type?: AutocompleteType;
}

const getTypeLabel = (type?: AutocompleteType) => {
  if (type === "USER") return "User";
  if (type === "PLACE") return "Place";
  return undefined;
};

export const AutocompleteItem = ({
  className,
  title,
  subtitle,
  type,
  ...props
}: AutocompleteItemProps) => {
  const { t } = useT();
  const labelKey = getTypeLabel(type);

  return (
    <div
      className={cx("flex items-start justify-between gap-3 px-3 py-2", className)}
      {...props}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
      </div>
      {labelKey ? (
        <Badge tone="neutral" size="sm">
          {t(labelKey)}
        </Badge>
      ) : null}
    </div>
  );
};
