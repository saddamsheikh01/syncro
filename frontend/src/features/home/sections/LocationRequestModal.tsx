"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { NavIcon } from "@/components/ui/NavIcon";
import { useT } from "@/hooks";

interface LocationRequestModalProps {
  open: boolean;
  onClose: () => void;
  onActivate: () => void;
  loading?: boolean;
}

const BENEFITS = [
  "Personalized suggestions based on your area",
  "Matches with people near you",
  "Places and experiences nearby",
  "A feed with content from your area",
];

export const LocationRequestModal = ({
  open,
  onClose,
  onActivate,
  loading,
}: LocationRequestModalProps) => {
  const { t } = useT();
  return (
    <Modal
      open={open}
      title={t("Enable location")}
      description={t(
        "Location improves your Syncro experience. You can always change it in settings."
      )}
      primaryAction={{
        label: loading ? t("Enabling...") : t("Enable location"),
        onClick: onActivate,
      }}
      secondaryAction={{
        label: t("Not now"),
        onClick: onClose,
        variant: "ghost",
      }}
      onClose={onClose}
    >
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          {t("With location enabled you can:")}
        </p>
        <ul className="space-y-2">
          {BENEFITS.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted">
              <NavIcon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{t(benefit)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};
