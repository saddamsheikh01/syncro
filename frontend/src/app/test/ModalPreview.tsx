"use client";

import { useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Modal } from "@/components/ui/Modal";

export const ModalPreview = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Apri modal</Button>
      <Modal
        open={open}
        title="Conferma azione"
        description="Questa operazione aggiorna il tuo profilo."
        onClose={() => setOpen(false)}
        primaryAction={{
          label: "Conferma",
          onClick: () => setOpen(false),
        }}
        secondaryAction={{
          label: "Annulla",
          onClick: () => setOpen(false),
          variant: "secondary",
        }}
      >
        <p className="text-sm text-muted">
          Puoi annullare in qualsiasi momento dalle impostazioni.
        </p>
      </Modal>
    </>
  );
};
