"use client";

import type { HTMLAttributes } from "react";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";
import { ZyraSearchBar } from "@/features/zyra/search/ZyraSearchBar";

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  position?: "fixed" | "absolute";
}

export const Navbar = ({
  className,
  position = "fixed",
  ...props
}: NavbarProps) => (
  <header
    className={cx(
      position,
      "left-80 right-6 top-4 z-30",
      className
    )}
    {...props}
  >
    <Card className="p-4">
      <ZyraSearchBar />
    </Card>
  </header>
);
