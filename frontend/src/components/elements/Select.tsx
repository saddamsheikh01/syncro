"use client";

import { useId, useMemo, useState } from "react";
import type { HTMLAttributes } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { cx } from "@/lib/classNames";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  className?: string;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
}

export const Select = ({
  className,
  label,
  hint,
  error,
  placeholder = "Select",
  options,
  value,
  defaultValue,
  name,
  required,
  disabled,
  onValueChange,
  id,
  ...props
}: SelectProps) => {
  const autoId = useId();
  const selectId = useMemo(() => id ?? autoId, [id, autoId]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selectedValue = isControlled ? value : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);
  const isPlaceholder = !selectedOption;

  const dropdownItems = options.map((option) => ({
    id: option.value,
    label: option.label,
    description: option.description,
    disabled: option.disabled,
  }));

  const handleSelect = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <div className={cx("space-y-2", className)} {...props}>
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </label>
      ) : null}
      <Dropdown
        label={selectedOption?.label ?? placeholder}
        items={dropdownItems}
        onSelect={handleSelect}
        disabled={disabled}
        buttonId={selectId}
        buttonAriaLabel={label ?? placeholder}
        buttonClassName={cx(
          "w-full justify-between",
          isPlaceholder && "text-subtle",
          error && "border-danger/40"
        )}
        menuClassName="w-full"
      />
      {name ? (
        <input type="hidden" name={name} value={selectedValue ?? ""} />
      ) : null}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
};
