"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { NavIcon } from "@/components/ui/NavIcon";

interface LocationRequestModalProps {
  open: boolean;
  onClose: () => void;
  onActivate: () => void;
  loading?: boolean;
}

const BENEFITS = [
  "Suggerimenti personalizzati in base alla tua zona",
  "Match con persone vicine a te",
  "Luoghi ed esperienze nelle vicinanze",
  "Feed con contenuti della tua area",
];

export const LocationRequestModal = ({
  open,
  onClose,
  onActivate,
  loading,
}: LocationRequestModalProps) => {
  return (
    <Modal
      open={open}
      title="Attiva la posizione"
      description="La posizione migliora la tua esperienza su Syncro. Puoi sempre modificarla nelle impostazioni."
      primaryAction={{
        label: loading ? "Attivazione..." : "Attiva posizione",
        onClick: onActivate,
      }}
      secondaryAction={{
        label: "Non ora",
        onClick: onClose,
        variant: "ghost",
      }}
      onClose={onClose}
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          Con la posizione attiva potrai:
        </p>
        <ul className="space-y-2">
          {BENEFITS.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted">
              <NavIcon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};
