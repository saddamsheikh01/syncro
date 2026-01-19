import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

const MapIcon = () => (
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
    <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
    <path d="M9 3v15" />
    <path d="M15 6v15" />
  </svg>
);

export interface MapPermissionScreenProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  description?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  helper?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

export const MapPermissionScreen = ({
  className,
  title = "Usa la mappa",
  description = "Condividi la posizione per vedere luoghi vicini in tempo reale.",
  primaryActionLabel = "Attiva posizione",
  secondaryActionLabel = "Usa senza posizione",
  helper = "La posizione migliora i suggerimenti.",
  onPrimaryAction,
  onSecondaryAction,
  ...props
}: MapPermissionScreenProps) => (
  <Card className={cx("space-y-5 p-6", className)} {...props}>
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-surface-muted text-foreground">
        <MapIcon />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" onClick={onPrimaryAction}>{primaryActionLabel}</Button>
      <Button size="sm" variant="ghost" onClick={onSecondaryAction}>
        {secondaryActionLabel}
      </Button>
    </div>
    {helper ? <p className="text-xs text-subtle">{helper}</p> : null}
  </Card>
);
