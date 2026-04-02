"use client";

import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { useT } from "@/hooks";

interface RegistrationRequiredModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export const RegistrationRequiredModal = ({
  open,
  onClose,
  message,
}: RegistrationRequiredModalProps) => {
  const router = useRouter();
  const { t } = useT();

  return (
    <Modal
      open={open}
      title={t("Unlock Full Access")}
      description={message || t("Create a free account to unlock all features.")}
      onClose={onClose}
      primaryAction={{
        label: t("Create Free Account"),
        onClick: () => {
          onClose();
          router.push("/auth/register");
        },
      }}
      secondaryAction={{
        label: t("Maybe Later"),
        variant: "ghost",
        onClick: onClose,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>💾</span>
          <span>{t("Save your simulation results")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <span>{t("Track your real expenses vs budget")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <span>{t("Get your personalized Starter Kit")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🔓</span>
          <span>{t("Access Premium & Super Pro plans")}</span>
        </div>
      </div>
    </Modal>
  );
};
