"use client";

import { useId } from "react";
import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface MediaUploaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  description?: string;
  accept?: string;
  buttonLabel?: string;
}

export const MediaUploader = ({
  className,
  title = "Carica un media",
  description = "Immagini o video leggeri, max 1 file.",
  accept = "image/*,video/*",
  buttonLabel = "Seleziona file",
  ...props
}: MediaUploaderProps) => {
  const inputId = useId();

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <div className="flex flex-col items-start gap-3 rounded-[var(--radius-md)] border border-dashed border-border/60 bg-surface-muted px-4 py-6">
        <input id={inputId} type="file" accept={accept} className="sr-only" />
        <label htmlFor={inputId} className="inline-flex">
          <Button size="sm" variant="secondary">
            {buttonLabel}
          </Button>
        </label>
        <p className="text-xs text-subtle">PNG, JPG, MP4</p>
      </div>
    </Card>
  );
};
