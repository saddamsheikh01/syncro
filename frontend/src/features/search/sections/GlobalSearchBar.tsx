"use client";

import { Input } from "@/components/elements/Input";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

export interface GlobalSearchBarProps {
  className?: string;
  placeholder?: string;
  actionLabel?: string;
}

export const GlobalSearchBar = ({
  className,
  placeholder = "Cerca luoghi, esperienze o persone",
  actionLabel = "Filtri",
}: GlobalSearchBarProps) => (
  <Card className={cx("flex flex-wrap items-center gap-3 p-4", className)}>
    <div className="min-w-[220px] flex-1">
      <Input
        className="h-10"
        placeholder={placeholder}
        leftSlot={<SearchIcon />}
      />
    </div>
    <Button size="sm" variant="secondary">
      {actionLabel}
    </Button>
  </Card>
);
