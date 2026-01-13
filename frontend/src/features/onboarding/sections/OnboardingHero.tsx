import type { HTMLAttributes } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { cx } from "@/lib/classNames";

export interface OnboardingHeroFeature {
  title: string;
  description?: string;
}

export interface OnboardingHeroProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  subtitle?: string;
  badgeLabel?: string;
  features?: OnboardingHeroFeature[];
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  footnote?: string;
}

export const OnboardingHero = ({
  className,
  title,
  subtitle,
  badgeLabel = "Nuovo",
  features = [],
  primaryActionLabel = "Continua",
  secondaryActionLabel,
  footnote,
  ...props
}: OnboardingHeroProps) => (
  <Card className={cx("space-y-5 p-6", className)} {...props}>
    <div className="space-y-2">
      {badgeLabel ? (
        <Badge tone="accent" size="sm">
          {badgeLabel}
        </Badge>
      ) : null}
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
    {features.length ? (
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3"
          >
            <p className="text-sm font-semibold text-foreground">
              {feature.title}
            </p>
            {feature.description ? (
              <p className="text-xs text-subtle">{feature.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    ) : null}
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">{primaryActionLabel}</Button>
      {secondaryActionLabel ? (
        <Button size="sm" variant="ghost">
          {secondaryActionLabel}
        </Button>
      ) : null}
    </div>
    {footnote ? <p className="text-xs text-subtle">{footnote}</p> : null}
  </Card>
);
