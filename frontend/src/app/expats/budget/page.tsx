"use client";

import { useAuth } from "@/hooks";
import { MainLayout } from "@/components/layout/MainLayout";
import BudgetPage from "@/features/expats/budget/BudgetPage";

export default function BudgetPageRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <MainLayout>
        <BudgetPage />
      </MainLayout>
    );
  }

  return <BudgetPage />;
}
