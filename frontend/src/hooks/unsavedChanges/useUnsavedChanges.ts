"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseUnsavedChangesOptions {
  /** Indica se ci sono modifiche non salvate */
  isDirty: boolean;
  /** Messaggio mostrato nel dialog del browser (beforeunload) */
  message?: string;
}

export interface UseUnsavedChangesReturn {
  /** Mostra il modale di conferma */
  showModal: boolean;
  /** URL di destinazione pendente */
  pendingUrl: string | null;
  /** Conferma la navigazione (procedi senza salvare) */
  confirmNavigation: () => void;
  /** Annulla la navigazione (resta sulla pagina) */
  cancelNavigation: () => void;
  /** Reset dello stato dirty (da chiamare dopo il salvataggio) */
  resetDirty: () => void;
}

/**
 * Hook per gestire il warning di modifiche non salvate.
 *
 * Intercetta:
 * - Chiusura tab/browser (beforeunload)
 * - Navigazione interna tramite link (click intercept)
 * - Navigazione programmatica (popstate/back button)
 */
export const useUnsavedChanges = ({
  isDirty,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn => {
  const [showModal, setShowModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const isDirtyRef = useRef(isDirty);

  // Mantiene il ref aggiornato
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Intercetta beforeunload (chiusura tab/browser)
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Il messaggio personalizzato non viene mostrato nei browser moderni
      // ma è necessario impostare returnValue per attivare il dialog
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);

  // Intercetta click sui link interni
  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignora link esterni, anchor e target _blank
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        anchor.target === "_blank"
      ) {
        return;
      }

      // Ignora se non e' dirty
      if (!isDirtyRef.current) return;

      // Previeni navigazione e mostra modale
      event.preventDefault();
      event.stopPropagation();
      setPendingUrl(href);
      setShowModal(true);
    };

    // Usa capture per intercettare prima di altri handler
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty]);

  // Intercetta back/forward del browser
  useEffect(() => {
    if (!isDirty) return;

    // Aggiungi stato fittizio per intercettare popstate
    window.history.pushState({ unsavedChanges: true }, "");

    const handlePopState = () => {
      if (!isDirtyRef.current) return;

      // Ripristina lo stato per permettere il blocco
      window.history.pushState({ unsavedChanges: true }, "");
      setPendingUrl("back");
      setShowModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isDirty]);

  const confirmNavigation = useCallback(() => {
    setShowModal(false);
    isDirtyRef.current = false;

    if (pendingUrl === "back") {
      // Torna indietro di 2 (uno per lo stato fittizio, uno per la navigazione reale)
      window.history.go(-2);
    } else if (pendingUrl) {
      window.location.href = pendingUrl;
    }

    setPendingUrl(null);
  }, [pendingUrl]);

  const cancelNavigation = useCallback(() => {
    setShowModal(false);
    setPendingUrl(null);
  }, []);

  const resetDirty = useCallback(() => {
    isDirtyRef.current = false;
  }, []);

  return {
    showModal,
    pendingUrl,
    confirmNavigation,
    cancelNavigation,
    resetDirty,
  };
};
