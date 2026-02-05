"use client";

import { useMemo } from "react";
import { cx } from "@/lib/classNames";
import { useTutorial, useUi } from "@/hooks";

const STORAGE_KEY_A2HS = "syncro_a2hs_dismissed";

const useIsLocalhost = () => {
  return useMemo(() => {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname;
    return hostname === "localhost" || hostname === "127.0.0.1";
  }, []);
};

const CodeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export interface DevToolsProps {
  collapsed?: boolean;
}

export const DevTools = ({ collapsed = false }: DevToolsProps) => {
  const isDev = useIsLocalhost();
  const { actions: tutorialActions } = useTutorial();
  const { actions: uiActions } = useUi();

  if (!isDev) return null;

  const handleOpenTutorial = () => {
    // Solo apre il tutorial senza resettare completed/skipped
    tutorialActions.open();
  };

  const handleResetTutorial = () => {
    // Reset completo per testare il primo accesso
    tutorialActions.reset();
  };

  const handleOpenA2HS = () => {
    // Rimuove il dismiss e ricarica per mostrare la modale
    // Nota: questo triggera anche il tutorial se non completato
    localStorage.removeItem(STORAGE_KEY_A2HS);
    alert("A2HS localStorage cleared. Reload the page to see the modal.");
  };

  const handleTestNotification = () => {
    uiActions.pushToast({
      title: "Test notification",
      message: "This is a sample notification.",
      tone: "info",
      durationMs: 4500,
    });
  };

  return (
    <div
      className={cx(
        "border-t border-dashed border-amber-500/40 pt-4",
        collapsed && "flex flex-col items-center gap-2"
      )}
    >
      {collapsed ? (
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-amber-500 transition-colors hover:bg-amber-500/10"
          aria-label="Dev Tools"
          title="Dev Tools"
        >
          <CodeIcon />
        </button>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-amber-500">
              <CodeIcon />
            </span>
            <span className="text-xs font-semibold text-amber-500">
              Dev Tools
            </span>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleOpenTutorial}
              className="flex w-full items-center gap-2 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-muted/80 hover:text-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              Open tutorial
            </button>
            <button
              type="button"
              onClick={handleResetTutorial}
              className="flex w-full items-center gap-2 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-muted/80 hover:text-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset Tutorial
            </button>
            <button
              type="button"
              onClick={handleOpenA2HS}
              className="flex w-full items-center gap-2 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-muted/80 hover:text-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Reset Add to Home
            </button>
            <button
              type="button"
              onClick={handleTestNotification}
              className="flex w-full items-center gap-2 rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface-muted/80 hover:text-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12 5a4 4 0 0 0-4 4v3.5L6.5 15h11L16 12.5V9a4 4 0 0 0-4-4z" />
                <path d="M10 19a2 2 0 0 0 4 0" />
              </svg>
              Test notification
            </button>
          </div>
        </>
      )}
    </div>
  );
};
