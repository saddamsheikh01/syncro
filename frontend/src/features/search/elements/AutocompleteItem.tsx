import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";

export type AutocompleteType = "USER" | "PLACE" | "EXPERIENCE";

export interface AutocompleteItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  type?: AutocompleteType;
}

const getTypeLabel = (type?: AutocompleteType) => {
  if (type === "USER") return "Utente";
  if (type === "PLACE") return "Luogo";
  if (type === "EXPERIENCE") return "Esperienza";
  return undefined;
};

export const AutocompleteItem = ({
  className,
  title,
  subtitle,
  type,
  ...props
}: AutocompleteItemProps) => (
  <div className={cx("flex items-start justify-between gap-3 px-3 py-2", className)} {...props}>
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      {subtitle ? <p className="text-xs text-subtle">{subtitle}</p> : null}
    </div>
    {getTypeLabel(type) ? (
      <Badge tone="neutral" size="sm">
        {getTypeLabel(type)}
      </Badge>
    ) : null}
  </div>
);
