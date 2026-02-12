"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/buttons/Button";
import { AdminAuthInitializer } from "@/components/auth/AdminAuthInitializer";
import { Card } from "@/components/elements/Card";
import { Loader } from "@/components/elements/Loader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { useAdminAuth } from "@/hooks";

export interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "Product KPIs and trends",
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Application user overview",
  },
  {
    href: "/admin/matchmaking",
    label: "Matchmaking",
    description: "Weights and filter control",
  },
  {
    href: "/admin/admin-users",
    label: "Admin",
    description: "Back office access control",
  },
  {
    href: "/admin/tests",
    label: "Insights",
    description: "Test configuration and status",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    description: "Catalog categories",
  },
  {
    href: "/admin/places",
    label: "Places",
    description: "Places and affiliations",
  },
  {
    href: "/admin/experiences",
    label: "Experiences",
    description: "Experiences and affiliations",
  },
  {
    href: "/admin/referrals",
    label: "Referrals",
    description: "Referral codes and usage",
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    description: "Custom notification send",
  },
  {
    href: "/admin/sync/google-maps",
    label: "Sync Maps",
    description: "Google Maps sync",
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
          <p className="text-sm text-muted">Loading admin area...</p>
        </Card>
      </div>
    );
  }

  if (admin.role !== "SUPER_ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Card className="w-full max-w-lg space-y-4 p-6">
          <h1 className="text-xl font-semibold text-foreground">Access denied</h1>
          <p className="text-sm text-muted">
            This area is available only to users with the SUPER_ADMIN role.
          </p>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                void actions.logout();
              }}
            >
              Log out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <AdminSidebar
          items={NAV_ITEMS}
          pathname={pathname}
          adminEmail={admin.email}
          onLogout={() => void actions.logout()}
        />
      </div>

      <div className="lg:pl-[300px]">
        <div className="px-4 pb-10 pt-4 lg:px-0 lg:pb-12 lg:pt-6 lg:pr-8">
          <div className="lg:sticky lg:top-6 lg:z-20">
            <AdminTopbar
              email={admin.email}
              role={admin.role}
              onLogout={() => void actions.logout()}
            />
          </div>

          <div className="mt-4 lg:hidden">
            <AdminSidebar items={NAV_ITEMS} pathname={pathname} variant="mobile" />
          </div>

          <main className="mt-6">{children}</main>
        </div>
      </div>

      <AdminAuthInitializer />
    </div>
  );
};
