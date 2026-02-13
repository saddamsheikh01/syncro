import Link from "next/link";
import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { Button } from "@/components/buttons/Button";
import { cx } from "@/lib/classNames";

export interface AffiliationLinkBoxProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  description?: string;
  provider?: string;
  actionLabel?: string;
  href: string;
}

export const AffiliationLinkBox = ({
  className,
  title,
  description,
  provider,
  actionLabel = "Vai al partner",
  href,
  ...props
}: AffiliationLinkBoxProps) => {
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <Card className={cx("space-y-3 p-5", className)} {...props}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          {provider ?? "Partner"}
        </p>
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      <Link
        href={href}
        className="inline-flex"
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        <Button size="sm" variant="outline">
          {actionLabel}
        </Button>
      </Link>
    </Card>
  );
};
