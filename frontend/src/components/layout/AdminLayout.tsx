"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { AdminAuthInitializer } from "@/components/auth/AdminAuthInitializer";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { Logo } from "@/components/elements/Logo";
import { useAdminAuth } from "@/hooks";
import { cx } from "@/lib/classNames";

export interface AdminLayoutProps {
  children: ReactNode;
}

type AdminNavItem = {
  href: string;
  label: string;
  description: string;
};

const NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "KPI e andamento prodotto",
  },
  {
    href: "/admin/users",
    label: "Utenti",
    description: "Panoramica utenti applicazione",
  },
  {
    href: "/admin/admin-users",
    label: "Admin",
    description: "Gestione accessi backoffice",
  },
  {
    href: "/admin/tests",
    label: "Insights",
    description: "Configurazione test e stato",
  },
  {
    href: "/admin/categories",
    label: "Categorie",
    description: "CRUD categorie catalogo",
  },
  {
    href: "/admin/places",
    label: "Places",
    description: "CRUD luoghi e affiliazioni",
  },
  {
    href: "/admin/experiences",
    label: "Experiences",
    description: "CRUD esperienze e affiliazioni",
  },
  {
    href: "/admin/referrals",
    label: "Referrals",
    description: "Codici referral e usages",
  },
  {
    href: "/admin/notifications",
    label: "Notifiche",
    description: "Invio notifiche custom",
  },
  {
    href: "/admin/sync/google-maps",
    label: "Sync Maps",
    description: "Sincronizzazione Google Maps",
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { status, admin, tokens, actions } = useAdminAuth();

  useEffect(() => {
    if (status === "idle") {
      actions.hydrate();
    }
  }, [actions, status]);

  useEffect(() => {
    if (status === "authenticated" && !admin) {
      actions.fetchMe().catch(() => {
        actions.clearSession();
      });
    }
  }, [actions, admin, status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    }
  }, [router, status]);

  const isAuthenticated =
    status === "authenticated" || (status === "loading" && Boolean(tokens));

  if (!isAuthenticated || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Caricamento area admin...</p>
        </Card>
      </div>
    );
  }

  if (admin.role !== "SUPER_ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="w-full max-w-lg space-y-4 p-6">
          <h1 className="text-xl font-semibold text-foreground">Accesso negato</h1>
          <p className="text-sm text-muted">
            Questa area e disponibile solo per utenti con ruolo SUPER_ADMIN.
          </p>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                void actions.logout();
              }}
            >
              Esci
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[280px,1fr]">
      <aside className="border-b border-border/80 bg-surface-muted/40 p-4 lg:min-h-screen lg:border-r lg:border-b-0 lg:p-6">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft">
            <Logo width={24} className="h-auto w-6" priority />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Syncro Admin</p>
            <p className="text-xs text-subtle">Backoffice Super Admin</p>
          </div>
        </div>

        <nav className="space-y-2" aria-label="Navigazione backoffice">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "block rounded-[var(--radius-md)] border px-3 py-3 transition",
                  isActive
                    ? "border-accent/40 bg-accent-soft text-foreground"
                    : "border-transparent text-muted hover:border-border hover:bg-card"
                )}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-subtle">{item.description}</p>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-h-screen">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-card px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{admin.email}</p>
            <p className="text-xs text-subtle">Ruolo: {admin.role}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void actions.logout();
            }}
          >
            Logout
          </Button>
        </header>

        <main className="p-5 lg:p-8">{children}</main>
      </div>

      <AdminAuthInitializer />
    </div>
  );
};
