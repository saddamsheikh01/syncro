import { MainLayout } from "@/components/layout/MainLayout";
import BudgetPage from "@/features/expats/budget/BudgetPage";

export const metadata = {
  title: "Budget Simulator – Expats Mode",
  description:
    "Simulate your relocation budget with FREE, PREMIUM, and SUPER PRO plans. Track expenses and compare real vs expected costs.",
};

export default function BudgetPageRoute() {
  return (
    <MainLayout>
      <BudgetPage />
    </MainLayout>
  );
}
