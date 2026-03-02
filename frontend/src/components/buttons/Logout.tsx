"use client";

import { useRouter } from "next/navigation";
import { useAuth, useT } from "@/hooks";
import { resetAllStores } from "@/stores/utils/resetAllStores";
import { Button } from "@/components/buttons/Button";

export interface LogoutProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Logout = ({ className, size = "sm", fullWidth }: LogoutProps) => {
  const router = useRouter();
  const { t } = useT();
  const { status, actions } = useAuth();
  const isLoading = status === "loading";

  const handleLogout = async () => {
    try {
      // Clear session first so no components trigger authenticated requests
      // (e.g. Navbar fetching profile when profile is reset but tokens still set)
      actions.clearSession();
      resetAllStores();
      await actions.logout();
    } finally {
      router.replace("/login");
    }
  };

  return (
    <Button
      className={className}
      variant="danger"
      size={size}
      fullWidth={fullWidth}
      loading={isLoading}
      loadingText={t("Logging out...")}
      onClick={handleLogout}
    >
      {t("Logout")}
    </Button>
  );
};
