import type { HTMLAttributes, ReactNode } from "react";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export interface AdminFormSectionProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  description?: string;
  children: ReactNode;
}

export const AdminFormSection = ({
  className,
  title,
  description,
  children,
  ...props
}: AdminFormSectionProps) => (
  <Card className={cx("space-y-4 p-5", className)} {...props}>
    <div className="space-y-1">
      <h4 className="text-base font-semibold text-foreground">{title}</h4>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
    </div>
    <div className="space-y-3">{children}</div>
  </Card>
);
