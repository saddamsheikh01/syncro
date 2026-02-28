"use client";

import { useCallback, useState } from "react";
import { useT } from "@/hooks";
import { cx } from "@/lib/classNames";

const SHARE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.205.013-3.584.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export interface ShareLinkDropdownProps {
  shareUrl: string;
  /** Optional text to include with the link (e.g. title) when sharing to WhatsApp */
  shareText?: string;
  variant?: "button" | "ghost";
  className?: string;
}

export function ShareLinkDropdown({
  shareUrl,
  shareText,
  variant = "ghost",
  className,
}: ShareLinkDropdownProps) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const textWithUrl = shareText ? [shareText, shareUrl].join("\n\n") : shareUrl;

  const handleFacebook = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=400");
    setOpen(false);
  }, [shareUrl]);

  const handleInstagram = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setOpen(false);
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
    });
  }, [shareUrl]);

  const handleWhatsApp = useCallback(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(textWithUrl)}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  }, [textWithUrl]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setOpen(false);
  }, [shareUrl]);

  const buttonClass =
    variant === "ghost"
      ? "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-muted"
      : "inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:border-border-strong";

  return (
    <div className={cx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("Share")}
        className={buttonClass}
      >
        <span className="text-subtle">{SHARE_ICON}</span>
        <span>{t("Share")}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-[var(--radius-md)] border border-border/70 bg-card py-2 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleFacebook}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
            >
              <FacebookIcon />
              {t("Facebook")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleInstagram}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
            >
              <InstagramIcon />
              {t("Instagram")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleWhatsApp}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
            >
              <WhatsAppIcon />
              {t("WhatsApp")}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleCopy}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {t("Copy link")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
