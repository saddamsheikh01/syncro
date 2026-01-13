"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface ProfileInfoValues {
  fullName: string;
  city: string;
  country: string;
  bio: string;
}

export interface ProfileInfoFormProps {
  className?: string;
  value?: Partial<ProfileInfoValues>;
  defaultValue?: Partial<ProfileInfoValues>;
  onValueChange?: (value: ProfileInfoValues) => void;
  onSubmit?: (value: ProfileInfoValues) => void;
  submitLabel?: string;
  showSubmit?: boolean;
}

const EMPTY_VALUES: ProfileInfoValues = {
  fullName: "",
  city: "",
  country: "",
  bio: "",
};

export const ProfileInfoForm = ({
  className,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  submitLabel = "Salva",
  showSubmit = true,
}: ProfileInfoFormProps) => {
  const isControlled = value !== undefined;
  const initialValue = useMemo(
    () => ({ ...EMPTY_VALUES, ...defaultValue, ...value }),
    [defaultValue, value]
  );
  const [internalValue, setInternalValue] = useState(initialValue);
  const currentValue = isControlled
    ? { ...EMPTY_VALUES, ...value }
    : internalValue;

  const updateValue = (next: Partial<ProfileInfoValues>) => {
    const merged = { ...currentValue, ...next };
    if (!isControlled) {
      setInternalValue(merged);
    }
    onValueChange?.(merged);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(currentValue);
  };

  return (
    <Card className={cx("space-y-4 p-5", className)}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Nome completo"
          value={currentValue.fullName}
          placeholder="Nome e cognome"
          onChange={(event) => updateValue({ fullName: event.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Citta"
            value={currentValue.city}
            placeholder="Milano"
            onChange={(event) => updateValue({ city: event.target.value })}
          />
          <Input
            label="Paese"
            value={currentValue.country}
            placeholder="Italia"
            onChange={(event) => updateValue({ country: event.target.value })}
          />
        </div>
        <Textarea
          label="Bio"
          value={currentValue.bio}
          placeholder="Racconta qualcosa di te"
          onChange={(event) => updateValue({ bio: event.target.value })}
        />
        {showSubmit ? (
          <Button type="submit" size="sm" fullWidth>
            {submitLabel}
          </Button>
        ) : null}
      </form>
    </Card>
  );
};
