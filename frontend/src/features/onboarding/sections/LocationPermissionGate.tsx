"use client";

import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import type { ButtonProps } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

const LocationIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
    <circle cx="12" cy="11" r="2.5" />
  </svg>
);

export interface LocationPermissionGateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  primaryActionProps?: Omit<ButtonProps, "children">;
  secondaryActionProps?: Omit<ButtonProps, "children">;
  helper?: string;
}

export const LocationPermissionGate = ({
  className,
  title = "Enable location",
  description = "Used to suggest nearby places and matches.",
  primaryActionLabel = "Allow",
  secondaryActionLabel = "Not now",
  primaryActionProps,
  secondaryActionProps,
  helper = "You can change this anytime.",
  ...props
}: LocationPermissionGateProps) => {
  const { t } = useT();
  const resolvedTitle = title ? t(title) : t("Enable location");
  const resolvedDescription = description ? t(description) : null;
  const resolvedPrimaryLabel = primaryActionLabel ? t(primaryActionLabel) : null;
  const resolvedSecondaryLabel = secondaryActionLabel ? t(secondaryActionLabel) : null;
  const resolvedHelper = helper ? t(helper) : null;

  return (
    <Card className={cx("space-y-5 p-6", className)} {...props}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted text-foreground">
          <LocationIcon />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{resolvedTitle}</h3>
          {resolvedDescription ? (
            <p className="text-sm text-muted">{resolvedDescription}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {resolvedPrimaryLabel ? (
          <Button size="sm" {...primaryActionProps}>
            {resolvedPrimaryLabel}
          </Button>
        ) : null}
        {resolvedSecondaryLabel ? (
          <Button size="sm" variant="ghost" {...secondaryActionProps}>
            {resolvedSecondaryLabel}
          </Button>
        ) : null}
      </div>
      {resolvedHelper ? <p className="text-xs text-subtle">{resolvedHelper}</p> : null}
    </Card>
  );
};
