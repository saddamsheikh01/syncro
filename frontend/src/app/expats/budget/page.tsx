"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks";
import { MainLayout } from "@/components/layout/MainLayout";
import BudgetPage from "@/features/expats/budget/BudgetPage";

export default function BudgetPageRoute() {
  const { isAuthenticated, status, actions } = useAuth();

  useEffect(() => {
    if (status === "idle") {
      actions.hydrate();
    }
  }, [actions, status]);

  if (isAuthenticated) {
    return (
      <MainLayout>
        <BudgetPage />
      </MainLayout>
    );
  }

  return <BudgetPage />;
}
