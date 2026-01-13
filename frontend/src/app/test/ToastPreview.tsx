"use client";

import { useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Toast } from "@/components/ui/Toast";

export const ToastPreview = () => {
  const [visible, setVisible] = useState(true);

  return (
    <div className="space-y-4">
      {visible ? (
        <Toast
          tone="success"
          title="Profilo aggiornato"
          message="Le modifiche sono state salvate."
          onClose={() => setVisible(false)}
        />
      ) : (
        <Button variant="secondary" onClick={() => setVisible(true)}>
          Mostra toast
        </Button>
      )}
    </div>
  );
};
