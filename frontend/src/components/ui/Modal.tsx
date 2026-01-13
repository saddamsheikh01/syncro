"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { cx } from "@/lib/classNames";
import { Button } from "@/components/buttons/Button";

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
}

export interface ModalProps {
  open: boolean;
  title?: string;
  description?: string;
  children?: ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  onClose: () => void;
}

export const Modal = ({
  open,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  onClose,
}: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={cx(
          "w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-card p-6 shadow-lg",
          "space-y-5"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          {title ? (
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {children ? <div className="text-sm text-foreground">{children}</div> : null}
        <div className="flex flex-wrap justify-end gap-2">
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
