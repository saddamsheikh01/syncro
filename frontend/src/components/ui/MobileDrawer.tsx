"use client";

import { useEffect } from "react";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import { Logout } from "@/components/buttons/Logout";
import { Menu, MENU_ITEMS } from "@/components/ui/Menu";

const MOBILE_MENU_IDS = new Set(["home", "people", "insights", "profile"]);

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MobileDrawer = ({ open, onClose }: MobileDrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      className={cx(
        "fixed inset-0 z-50",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div
        className={cx(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cx(
          "absolute bottom-20 left-3 right-3 flex max-h-[70vh] flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border/70 bg-surface shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-[calc(100%+5rem)]"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Handle indicator */}
        <div className="flex justify-center py-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 pb-4">
          <h2 className="text-lg font-semibold text-foreground">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Close menu"
          >
            <NavIcon name="x" className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <Menu
            items={MENU_ITEMS.filter((item) => !MOBILE_MENU_IDS.has(item.id))}
            onItemClick={onClose}
            aria-label="Secondary navigation"
          />
        </div>

        {/* Logout section */}
        <div className="border-t border-border/50 p-4">
          <Logout fullWidth size="md" />
        </div>
      </div>
    </div>
  );
};
