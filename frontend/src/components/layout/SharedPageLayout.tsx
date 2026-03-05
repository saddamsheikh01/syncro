"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/elements/Logo";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth, useT } from "@/hooks";

export interface SharedPageLayoutProps {
  children: ReactNode;
}

export const SharedPageLayout = ({ children }: SharedPageLayoutProps) => {
  const pathname = usePathname();
  const { status, tokens, actions: authActions } = useAuth();
  const { t } = useT();
  const loginHref = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";

  useEffect(() => {
    if (status === "idle") {
      authActions.hydrate();
    }
  }, [status, authActions]);

  const isAuthed =
    status === "authenticated" || (status === "loading" && Boolean(tokens));

  if (status === "idle" || (status === "loading" && !tokens)) {
    return <div className="min-h-screen bg-background" />;
  }

  if (isAuthed) {
    return <MainLayout>{children}</MainLayout>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/">
            <Logo width={120} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={loginHref}
              className="text-sm font-medium text-foreground hover:text-accent transition"
            >
              {t("Sign in")}
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-95 transition"
            >
              {t("Sign up")}
            </Link>
          </div>
        </div>
      </header>
      <main className="pb-16">{children}</main>
    </div>
  );
};
