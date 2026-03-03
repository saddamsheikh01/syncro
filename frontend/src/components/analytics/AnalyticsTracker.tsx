"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAnalytics, useAuth } from "@/hooks";

const SESSION_START_KEY = "syncro_session_start";

const buildRoute = (pathname: string, searchParams: URLSearchParams) => {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export const AnalyticsTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useAuth();
  const { actions: analyticsActions } = useAnalytics();
  const lastRouteRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    analyticsActions.bootstrap();
  }, [status, analyticsActions]);

  // Traccia APP_OPEN una sola volta per sessione autenticata.
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!analyticsActions.markAppOpenedInSession()) return;

    void analyticsActions.trackEvent({ eventType: "APP_OPEN" });
    window.sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
  }, [status, analyticsActions]);

  // Traccia page view ad ogni cambio route.
  useEffect(() => {
    if (status !== "authenticated") return;
    const route = buildRoute(pathname, searchParams);
    if (lastRouteRef.current === route) return;
    lastRouteRef.current = route;
    void analyticsActions.trackScreenViewed(route);
  }, [analyticsActions, pathname, searchParams, status]);

  // Traccia SESSION_DURATION quando la pagina viene nascosta/chiusa.
  useEffect(() => {
    if (status !== "authenticated") return;

    const ensureSessionStart = () => {
      const existing = window.sessionStorage.getItem(SESSION_START_KEY);
      if (existing) return;
      window.sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    };

    const sendSessionDuration = () => {
      const rawStart = window.sessionStorage.getItem(SESSION_START_KEY);
      if (!rawStart) return;
      const startedAt = Number(rawStart);
      if (!Number.isFinite(startedAt) || startedAt <= 0) {
        window.sessionStorage.removeItem(SESSION_START_KEY);
        return;
      }

      const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
      if (durationSeconds <= 0) return;

      window.sessionStorage.removeItem(SESSION_START_KEY);
      void analyticsActions.trackEvent({
        eventType: "SESSION_DURATION",
        payload: { duration_seconds: durationSeconds },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendSessionDuration();
        return;
      }
      if (document.visibilityState === "visible") {
        ensureSessionStart();
      }
    };

    const handleBeforeUnload = () => {
      sendSessionDuration();
    };

    ensureSessionStart();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [analyticsActions, status]);

  return null;
};
