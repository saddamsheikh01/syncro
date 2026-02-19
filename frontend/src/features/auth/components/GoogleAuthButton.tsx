"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/hooks";

const GOOGLE_SCRIPT_ID = "syncro-google-identity-script";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let googleScriptLoadingPromise: Promise<void> | null = null;

const loadGoogleIdentityScript = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (googleScriptLoadingPromise) {
    return googleScriptLoadingPromise;
  }

  googleScriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as
      | HTMLScriptElement
      | null;

    if (existing) {
      if (window.google?.accounts?.id || existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Identity script load failed")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () =>
      reject(new Error("Google Identity script load failed"));
    document.head.appendChild(script);
  });

  return googleScriptLoadingPromise;
};

type GoogleAuthButtonProps = {
  mode: "signin" | "signup";
  disabled?: boolean;
  onCredential: (credential: string) => Promise<void> | void;
};

export const GoogleAuthButton = ({
  mode,
  disabled = false,
  onCredential,
}: GoogleAuthButtonProps) => {
  const { t } = useT();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  const hasClientId = clientId.length > 0;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onCredential);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let isMounted = true;
    if (!hasClientId) {
      return () => {
        isMounted = false;
      };
    }

    loadGoogleIdentityScript()
      .then(() => {
        if (!isMounted || !containerRef.current || !window.google?.accounts?.id) {
          return;
        }

        setLoadError(null);
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential = response.credential;
            if (!credential || disabled) {
              return;
            }
            void callbackRef.current(credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: mode === "signup" ? "signup_with" : "signin_with",
          logo_alignment: "left",
        });
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(t("Google sign in is currently unavailable."));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clientId, disabled, hasClientId, mode, t]);

  const resolvedError = hasClientId
    ? loadError
    : t("Google sign in is currently unavailable.");

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={disabled ? "pointer-events-none opacity-60" : undefined}
      />
      {resolvedError ? (
        <p className="text-xs text-danger">{resolvedError}</p>
      ) : null}
    </div>
  );
};
