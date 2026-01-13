"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { Button } from "@/components/buttons/Button";

export interface LogoutProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Logout = ({ className, size = "sm", fullWidth }: LogoutProps) => {
  const router = useRouter();
  const { status, actions } = useAuth();
  const isLoading = status === "loading";

  const handleLogout = async () => {
    try {
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
      loadingText="Uscita"
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
};
