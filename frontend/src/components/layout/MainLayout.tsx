"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Leftbar } from "@/components/ui/Leftbar";
import { Rightbar } from "@/components/ui/Rightbar";
import { MobileBar } from "@/components/ui/MobileBar";
import { AddToHomeScreenModal } from "@/components/ui/AddToHomeScreenModal";
import { EarlyAccessFeedbackModal } from "@/components/ui/EarlyAccessFeedbackModal";
import { CookieConsentDrawer } from "@/components/ui/CookieConsentDrawer";
import { NotificationStack } from "@/components/ui/NotificationStack";
import { AnalyticsTracker } from "@/components/analytics/AnalyticsTracker";
import { NotificationsTracker } from "@/components/notifications/NotificationsTracker";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { useAuth } from "@/hooks";
import { cx } from "@/lib/classNames";

export interface MainLayoutProps {
  children: ReactNode;
  mode?: "default" | "preview";
}

export const MainLayout = ({ children, mode = "default" }: MainLayoutProps) => {
  const [leftbarCollapsed, setLeftbarCollapsed] = useState(false);
  const isPreview = mode === "preview";
  const position = isPreview ? "absolute" : "fixed";
  const router = useRouter();
  const pathname = usePathname();
  const { status, tokens, actions: authActions } = useAuth();

  useEffect(() => {
    if (status === "idle") {
      authActions.hydrate();
      return;
    }
    if (status === "unauthenticated") {
      const redirect = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
      router.replace(redirect);
    }
  }, [status, authActions, router, pathname]);

  const isAuthed =
    status === "authenticated" || (status === "loading" && Boolean(tokens));

  if (!isAuthed) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div
      className={cx(
        "bg-background",
        isPreview ? "relative h-full overflow-hidden" : "min-h-screen"
      )}
    >
      <div className="hidden lg:block">
        <Leftbar
          position={position}
          collapsed={leftbarCollapsed}
          onCollapse={setLeftbarCollapsed}
        />
      </div>

      <div className="hidden lg:block">
        <Navbar
          position={position}
          className={cx(
            "transition-all duration-300",
            leftbarCollapsed ? "left-24" : "left-80",
            "right-10 xl:right-[352px]"
          )}
        />
      </div>

      <div className="hidden xl:block">
        <Rightbar position={position} />
      </div>

      <main
        className={cx(
          isPreview ? "min-h-full" : "min-h-screen",
          "transition-all duration-300",
          "pb-24 lg:pt-36 lg:pb-8",
          leftbarCollapsed ? "lg:pl-24" : "lg:pl-80",
          "lg:pr-10 xl:pr-[352px]"
        )}
      >
        <div className="h-full w-full">{children}</div>
      </main>

      <div className="lg:hidden">
        <MobileBar position={position} />
        <AddToHomeScreenModal />
      </div>

      <CookieConsentDrawer />
      <EarlyAccessFeedbackModal />
      <NotificationStack />
      <NotificationsTracker />
      <AnalyticsTracker />
      <AuthInitializer />
    </div>
  );
};
