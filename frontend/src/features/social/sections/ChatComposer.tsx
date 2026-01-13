import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Textarea } from "@/components/elements/Textarea";
import { cx } from "@/lib/classNames";

export interface ChatComposerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  placeholder?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  helper?: string;
}

export const ChatComposer = ({
  className,
  placeholder = "Scrivi un messaggio...",
  primaryActionLabel = "Invia",
  secondaryActionLabel = "Allega",
  helper,
  ...props
}: ChatComposerProps) => (
  <Card className={cx("space-y-3 p-4", className)} {...props}>
    <Textarea placeholder={placeholder} rows={3} />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button size="sm" variant="secondary">
        {secondaryActionLabel}
      </Button>
      <Button size="sm">{primaryActionLabel}</Button>
    </div>
    {helper ? <p className="text-xs text-subtle">{helper}</p> : null}
  </Card>
);
