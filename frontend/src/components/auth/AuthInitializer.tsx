"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { setOnUnauthorized } from "@/services/axiosConfig";
import { resetAllStores } from "@/stores/utils/resetAllStores";
import { useAuth } from "@/hooks";

const PUBLIC_PATHS = ["/login", "/register", "/"];

export const AuthInitializer = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { actions } = useAuth();

  useEffect(() => {
    // Set up the unauthorized callback
    setOnUnauthorized(() => {
      // Reset all user-specific stores and localStorage
      resetAllStores();
      // Clear auth session
      actions.clearSession();
      // Redirect to login if not already on a public path
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.replace("/login");
      }
    });

    return () => {
      setOnUnauthorized(null);
    };
  }, [actions, router, pathname]);

  return null;
};
