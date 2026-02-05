"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/classNames";
import { NavIcon } from "@/components/ui/NavIcon";
import type { NavIconName } from "@/components/ui/NavIcon";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { Logout } from "@/components/buttons/Logout";

type DrawerMenuItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
  isZyra?: boolean;
};

const DRAWER_ITEMS: DrawerMenuItem[] = [
  { id: "zyra", label: "Zyra", href: "/zyra", icon: "spark", isZyra: true },
  { id: "map", label: "Mappa", href: "/map", icon: "map" },
  { id: "chat", label: "Chat", href: "/chat", icon: "chat" },
  { id: "insights", label: "Insights", href: "/insights", icon: "document" },
  { id: "places", label: "Luoghi", href: "/places", icon: "map-pin" },
  { id: "favorites", label: "Preferiti", href: "/favorites", icon: "star" },
  { id: "settings", label: "Impostazioni", href: "/settings", icon: "sliders" },
];

export interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MobileDrawer = ({ open, onClose }: MobileDrawerProps) => {
  const pathname = usePathname();

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

  const isActive = (href: string) => {
    const normalizedPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    const normalizedHref = href.endsWith("/") ? href.slice(0, -1) : href;
    return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
  };

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
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cx(
          "absolute bottom-20 left-3 right-3 max-h-[70vh] rounded-[var(--radius-xl)] border border-border/70 bg-surface shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-[calc(100%+5rem)]"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu di navigazione"
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-muted transition-colors hover:bg-surface-muted/80 hover:text-foreground"
            aria-label="Chiudi menu"
          >
            <NavIcon name="x" className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="overflow-y-auto p-4" aria-label="Menu secondario">
          <ul className="space-y-1">
            {DRAWER_ITEMS.map((item) => {
              const active = isActive(item.href);
              const isZyra = item.isZyra;

              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cx(
                      "flex items-center gap-4 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-medium transition-colors",
                      !isZyra && active && "bg-accent-soft text-accent",
                      !isZyra && !active && "text-foreground hover:bg-surface-muted",
                      isZyra && active && "border border-zyra-border/70 bg-zyra-glow/50 text-zyra-text shadow-[0_0_20px_var(--zyra-glow)]",
                      isZyra && !active && "text-zyra-text/80 hover:bg-zyra-glow/40 hover:text-zyra-text"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={cx(
                        "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                        !isZyra && active && "border-accent/30 bg-accent-soft text-accent",
                        !isZyra && !active && "border-border bg-surface text-muted",
                        isZyra && "border-transparent bg-transparent"
                      )}
                    >
                      {isZyra ? (
                        <ZyraMark size="sm" glow={active} />
                      ) : (
                        <NavIcon name={item.icon} className="h-5 w-5" />
                      )}
                    </span>
                    <span
                      className={cx(
                        isZyra && "bg-gradient-to-r from-zyra-start via-zyra-mid to-zyra-end bg-clip-text text-transparent"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout section */}
        <div className="border-t border-border/50 p-4">
          <Logout fullWidth size="md" />
        </div>
      </div>
    </div>
  );
};
