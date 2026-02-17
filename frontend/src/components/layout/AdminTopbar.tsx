"use client";

import type { HTMLAttributes } from "react";
import { Badge } from "@/components/elements/Badge";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

export interface AdminTopbarProps extends HTMLAttributes<HTMLDivElement> {
  email: string;
  role: string;
  onLogout: () => void;
}

export const AdminTopbar = ({
  email,
  role,
  onLogout,
  className,
  ...props
}: AdminTopbarProps) => {
  const { t } = useT();

  return (
    <div className={cx("w-full", className)} {...props}>
      <Card className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] border-border/70 bg-surface/90 p-4 shadow-md backdrop-blur">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-subtle">
            {t("Back office")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {t("Syncro Admin")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageSwitch variant="compact" align="right" />
          <Badge tone="accent" size="sm">
            {role}
          </Badge>
          <p className="text-sm font-semibold text-foreground">{email}</p>
          <Button size="sm" variant="outline" onClick={onLogout}>
            {t("Log out")}
          </Button>
        </div>
      </Card>
    </div>
  );
};
