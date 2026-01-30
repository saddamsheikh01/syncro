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
  title = "Modifiche non salvate",
  description = "Hai apportato delle modifiche che non sono state salvate. Se esci adesso, le modifiche andranno perse.",
}: UnsavedChangesModalProps) => {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      secondaryAction={{
        label: "Resta sulla pagina",
        onClick: onCancel,
        variant: "secondary",
      }}
      primaryAction={{
        label: "Esci senza salvare",
        onClick: onConfirm,
        variant: "danger",
      }}
    />
  );
};
