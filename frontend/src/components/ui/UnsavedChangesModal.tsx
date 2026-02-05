"use client";

import { Modal } from "./Modal";

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
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      secondaryAction={{
        label: "Stay on this page",
        onClick: onCancel,
        variant: "secondary",
      }}
      primaryAction={{
        label: "Leave without saving",
        onClick: onConfirm,
        variant: "danger",
      }}
    />
  );
};
