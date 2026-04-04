"use client";

import { useAuth } from "@/hooks";
import { MainLayout } from "@/components/layout/MainLayout";
import WowPage from "@/features/expats/wow/WowPage";

export default function WowPageRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <MainLayout>
        <WowPage />
      </MainLayout>
    );
  }

  return <WowPage />;
}
