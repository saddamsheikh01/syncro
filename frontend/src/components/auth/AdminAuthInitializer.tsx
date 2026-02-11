"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/hooks";
import { setOnUnauthorized } from "@/services/axiosConfig";

const PUBLIC_PATHS = ["/admin/login", "/admin/register", "/"];

export const AdminAuthInitializer = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { actions } = useAdminAuth();

  useEffect(() => {
    setOnUnauthorized(() => {
      actions.clearSession();
      if (!PUBLIC_PATHS.includes(pathname)) {
        router.replace("/admin/login");
      }
    });

    return () => {
      setOnUnauthorized(null);
    };
  }, [actions, pathname, router]);

  return null;
};
