import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { cx } from "@/lib/classNames";

const ZyraOrb = () => <ZyraMark size="md" />;

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
          <h3 className="text-lg font-semibold text-foreground">
            <span className="bg-gradient-to-r from-zyra-start via-zyra-mid to-zyra-end bg-clip-text text-transparent">
              {title}
            </span>
          </h3>
          {statusLabel ? (
            <span className="rounded-full border border-border/70 bg-surface-muted px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground">
              {statusLabel}
            </span>
          ) : null}
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
