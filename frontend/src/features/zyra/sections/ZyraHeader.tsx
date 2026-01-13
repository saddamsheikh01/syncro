import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";

const ZyraOrb = () => (
  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
    <span className="text-lg font-semibold">Z</span>
  </span>
);

export interface ZyraHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  subtitle?: string;
  statusLabel?: string;
  actionLabel?: string;
}

export const ZyraHeader = ({
  className,
  title = "Zyra",
  subtitle = "La tua guida intelligente",
  statusLabel = "Online",
  actionLabel = "Nuova chat",
  ...props
}: ZyraHeaderProps) => (
  <div className={cx("flex flex-wrap items-center justify-between gap-4", className)} {...props}>
    <div className="flex items-center gap-3">
      <ZyraOrb />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {statusLabel ? <Badge size="sm">{statusLabel}</Badge> : null}
        </div>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
    </div>
    {actionLabel ? (
      <Button size="sm" variant="secondary">
        {actionLabel}
      </Button>
    ) : null}
  </div>
);
