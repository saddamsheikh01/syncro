import { MainLayout } from "@/components/layout/MainLayout";
import ActivationPage from "@/features/expats/activation/ActivationPage";

export const metadata = {
  title: "Your Relocation Plan – Expats Mode",
  description:
    "Your personalized relocation action plan with 90-day strategy, verified professionals, and budget simulation.",
};

export default function ActivationPageRoute() {
  return (
    <MainLayout>
      <ActivationPage />
    </MainLayout>
  );
}
