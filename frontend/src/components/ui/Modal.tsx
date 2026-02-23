"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { cx } from "@/lib/classNames";
import { Button } from "@/components/buttons/Button";

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
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
          "flex w-full max-w-lg max-h-[85dvh] flex-col rounded-[var(--radius-lg)] border border-border/70 bg-card shadow-lg",
          "overflow-hidden"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 space-y-2 p-6 pb-0">
          {title ? (
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-6 text-sm text-foreground">
            {children}
          </div>
        ) : null}
        {(primaryAction || secondaryAction) ? (
        <div className="flex shrink-0 flex-wrap justify-end gap-2 p-6 pt-0">
          {secondaryAction ? (
            <Button
              variant={secondaryAction.variant ?? "secondary"}
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              loading={secondaryAction.loading}
              loadingText={secondaryAction.loadingText}
            >
              {secondaryAction.label}
            </Button>
          ) : null}
          {primaryAction ? (
            <Button
              variant={primaryAction.variant ?? "primary"}
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              loading={primaryAction.loading}
              loadingText={primaryAction.loadingText}
            >
              {primaryAction.label}
            </Button>
          ) : null}
        </div>
        ) : null}
      </div>
    </div>
  );
};
