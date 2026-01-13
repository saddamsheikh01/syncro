"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { cx } from "@/lib/classNames";
import { Button } from "@/components/buttons/Button";

export interface DrawerAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
}

export interface DrawerProps {
  open: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
  primaryAction?: DrawerAction;
  secondaryAction?: DrawerAction;
  onClose: () => void;
}

export const Drawer = ({
  open,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  onClose,
}: DrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <div
      className={cx(
        "fixed inset-0 z-40",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      <div
        className={cx(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cx(
          "absolute bottom-0 left-0 right-0 rounded-t-[var(--radius-xl)] border border-border bg-card p-6 shadow-lg transition-transform",
          open ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="space-y-2">
          {title ? (
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {children ? <div className="mt-4 text-sm text-foreground">{children}</div> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {secondaryAction ? (
            <Button
              variant={secondaryAction.variant ?? "secondary"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
          {primaryAction ? (
            <Button
              variant={primaryAction.variant ?? "primary"}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
