"use client";

import { Modal } from "./Modal";
import { useT } from "@/hooks";

export interface UnsavedChangesModalProps {
  /** Visibilita del modale */
  open: boolean;
  /** Callback per confermare l'uscita senza salvare */
  onConfirm: () => void;
  /** Callback per annullare e restare sulla pagina */
  onCancel: () => void;
  /** Titolo personalizzato */
  title?: string;
  /** Descrizione personalizzata */
  description?: string;
}

/**
 * Modale di conferma per modifiche non salvate.
 * Usa il componente Modal esistente per mantenere coerenza stilistica.
 */
export const UnsavedChangesModal = ({
  open,
  onConfirm,
  onCancel,
  title = "Unsaved changes",
  description = "You have unsaved changes. If you leave now, your changes will be lost.",
}: UnsavedChangesModalProps) => {
  const { t } = useT();
  const resolvedTitle = title ? t(title) : t("Unsaved changes");
  const resolvedDescription = description
    ? t(description)
    : t("You have unsaved changes. If you leave now, your changes will be lost.");

  return (
    <Modal
      open={open}
      title={resolvedTitle}
      description={resolvedDescription}
      onClose={onCancel}
      secondaryAction={{
        label: t("Stay on this page"),
        onClick: onCancel,
        variant: "secondary",
      }}
      primaryAction={{
        label: t("Leave without saving"),
        onClick: onConfirm,
        variant: "danger",
      }}
    />
  );
};
