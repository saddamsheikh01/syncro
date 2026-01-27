"use client";

import { useEffect, useRef } from "react";
import { useAuth, useAnalytics } from "@/hooks";

const SESSION_START_KEY = "syncro_session_start";
const TOKEN_STORAGE_KEY = "syncro.auth.tokens";

const getStoredAccessToken = (): string | null => {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.accessToken ?? null;
  } catch {
    return null;
  }
};

export const AnalyticsTracker = () => {
  const { status } = useAuth();
  const { actions: analyticsActions } = useAnalytics();
  const appOpenTrackedRef = useRef(false);

  // Traccia APP_OPEN quando l'utente e autenticato
  useEffect(() => {
    if (status !== "authenticated") return;
    if (appOpenTrackedRef.current) return;
    appOpenTrackedRef.current = true;

    analyticsActions.trackEvent({ eventType: "APP_OPEN" }).catch(() => undefined);

    // Inizializza il timestamp di inizio sessione
    sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
  }, [status, analyticsActions]);

  // Traccia SESSION_DURATION quando l'utente lascia la pagina
  useEffect(() => {
    if (status !== "authenticated") return;

    const sendSessionDuration = () => {
      const storedStart = sessionStorage.getItem(SESSION_START_KEY);
      if (!storedStart) return;

      const startTime = Number(storedStart);
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);

      if (durationSeconds <= 0) return;

      const accessToken = getStoredAccessToken();
      if (!accessToken) return;

      const payload = JSON.stringify({
        eventType: "SESSION_DURATION",
        payload: { duration_seconds: durationSeconds },
      });

      // Usa fetch con keepalive per inviare con Authorization header
      fetch("/api/v1/analytics/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);

      sessionStorage.removeItem(SESSION_START_KEY);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendSessionDuration();
      }
    };

    const handleBeforeUnload = () => {
      sendSessionDuration();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [status]);

  return null;
};
