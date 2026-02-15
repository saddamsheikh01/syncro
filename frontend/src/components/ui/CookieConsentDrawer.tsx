"use client";

import { useState, useEffect } from "react";
import { Drawer } from "./Drawer";
import { Switch } from "@/components/elements/Switch";
import { useUserStore } from "@/stores/user/useUserStore";
import { userActions } from "@/stores/user/userStore";
import { readStorage, writeStorage } from "@/stores/utils/storage";
import { useT } from "@/hooks";

const COOKIE_CONSENT_KEY = "syncro.cookie.consent";

type CookieConsentData = {
  accepted: boolean;
  acceptedAt: string | null;
};

export interface CookieConsentDrawerProps {
  onConsentGiven?: () => void;
}

export const CookieConsentDrawer = ({
  onConsentGiven,
}: CookieConsentDrawerProps) => {
  const [open, setOpen] = useState(false);
  const [newsletterChecked, setNewsletterChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const { t } = useT();
  const preferences = useUserStore((state) => state.preferences);

  useEffect(() => {
    const consent = readStorage<CookieConsentData | null>(
      COOKIE_CONSENT_KEY,
      null
    );

    // Se l'utente ha già accettato in localStorage, non mostrare il drawer
    // Il localStorage è la fonte di verità per non rimostare il banner
    if (consent?.accepted === true) {
      setOpen(false);
      return;
    }

    // Se le preferences non sono ancora caricate, aspetta
    // (evita di mostrare il drawer prima che il backend risponda)
    if (preferences === null) {
      return;
    }

    // Se l'utente ha già accettato la privacy policy nel backend
    // ma non ha il cookie locale (es. nuovo dispositivo), salva il cookie
    if (preferences.privacyPolicyAccepted === true) {
      writeStorage(COOKIE_CONSENT_KEY, {
        accepted: true,
        acceptedAt: preferences.privacyPolicyAcceptedAt,
      });
      setOpen(false);
      return;
    }

    // Altrimenti mostra il drawer
    setOpen(true);

    // Pre-popola lo switch newsletter se già accettata
    if (preferences.newsletterConsent) {
      setNewsletterChecked(true);
    }
  }, [preferences]);

  const handleAccept = async () => {
    setLoading(true);

    try {
      // Salva il consenso cookie in localStorage
      const consentData: CookieConsentData = {
        accepted: true,
        acceptedAt: new Date().toISOString(),
      };
      writeStorage(COOKIE_CONSENT_KEY, consentData);

      // Salva privacy policy e newsletter consent nel backend
      await userActions.savePreferences({
        privacyPolicyAccepted: true,
        newsletterConsent: newsletterChecked,
      });

      setOpen(false);
      onConsentGiven?.();
    } catch (error) {
      console.error("Error saving consent preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // L'utente non può chiudere il drawer senza accettare la privacy policy
    // Quindi non facciamo nulla qui
  };

  return (
    <Drawer
      open={open}
      title={t("cookieConsent.title")}
      description={t("cookieConsent.description")}
      onClose={handleClose}
      primaryAction={{
        label: loading
          ? t("cookieConsent.primaryAction.saving")
          : t("cookieConsent.primaryAction.accept"),
        onClick: handleAccept,
        variant: "primary",
      }}
    >
      <div className="space-y-4">
        <div className="rounded-[var(--radius-md)] border border-border/70 bg-surface-muted p-4">
          <p className="text-sm text-foreground">
            {t("cookieConsent.box.text")}
          </p>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
          >
            {t("cookieConsent.box.privacyLink")}
          </a>
        </div>

        <Switch
          label={t("cookieConsent.newsletter.label")}
          description={t("cookieConsent.newsletter.description")}
          checked={newsletterChecked}
          onChange={(e) => setNewsletterChecked(e.target.checked)}
        />
      </div>
    </Drawer>
  );
};
