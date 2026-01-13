"use client";

import { useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";

export const DrawerPreview = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Apri drawer</Button>
      <Drawer
        open={open}
        title="Filtri"
        description="Seleziona preferenze per affinare i risultati."
        onClose={() => setOpen(false)}
        primaryAction={{
          label: "Applica",
          onClick: () => setOpen(false),
        }}
        secondaryAction={{
          label: "Chiudi",
          onClick: () => setOpen(false),
          variant: "secondary",
        }}
      >
        <div className="space-y-3">
          <Input label="Citta" placeholder="Milano" />
          <Select
            label="Distanza"
            defaultValue="10"
            options={[
              { value: "5", label: "5 km" },
              { value: "10", label: "10 km" },
              { value: "25", label: "25 km" },
            ]}
          />
        </div>
      </Drawer>
    </>
  );
};
