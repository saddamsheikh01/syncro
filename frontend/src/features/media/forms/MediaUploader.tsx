"use client";

import { useId } from "react";
import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { useT } from "@/hooks";
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
  title,
  description,
  accept = "image/*,video/*",
  buttonLabel,
  ...props
}: MediaUploaderProps) => {
  const inputId = useId();
  const { t } = useT();

  const resolvedTitle = title ?? t("Upload media");
  const resolvedDescription = description ?? t("Images or videos, max 1 file.");
  const resolvedButtonLabel = buttonLabel ?? t("Choose file");

  return (
    <Card className={cx("space-y-4 p-5", className)} {...props}>
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-foreground">
          {resolvedTitle}
        </h4>
        <p className="text-sm text-muted">{resolvedDescription}</p>
      </div>
      <div className="flex flex-col items-start gap-3 rounded-[var(--radius-md)] border border-dashed border-border/70 bg-surface-muted px-4 py-6">
        <input id={inputId} type="file" accept={accept} className="sr-only" />
        <label htmlFor={inputId} className="inline-flex">
          <Button size="sm" variant="secondary">
            {resolvedButtonLabel}
          </Button>
        </label>
        <p className="text-xs text-subtle">{t("PNG, JPG, MP4")}</p>
      </div>
    </Card>
  );
};
