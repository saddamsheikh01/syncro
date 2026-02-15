"use client";

import Link from "next/link";
import type { HTMLAttributes } from "react";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

const ShortcutItem = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="flex items-center gap-2 text-xs text-muted transition hover:text-foreground"
  >
    <span className="h-1.5 w-1.5 rounded-full bg-accent/60" aria-hidden="true" />
    <span>{label}</span>
  </Link>
);

export interface RightbarShortcutsCardProps
  extends HTMLAttributes<HTMLDivElement> {}

export const RightbarShortcutsCard = ({
  className,
  ...props
}: RightbarShortcutsCardProps) => {
  const { t } = useT();

  return (
    <div className={cx("space-y-2", className)} {...props}>
      <p className="text-xs font-semibold text-foreground">
        {t("Smart Shortcuts")}
      </p>
      <div className="space-y-1.5">
        <ShortcutItem href="/matches" label={t("Find people aligned with you")} />
        <ShortcutItem
          href="/places"
          label={t("Explore compatible places")}
        />
        <ShortcutItem href="/profile" label={t("Improve my profile")} />
      </div>
    </div>
  );
};
