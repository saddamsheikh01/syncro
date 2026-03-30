import { MainLayout } from "@/components/layout/MainLayout";
import StarterKitPage from "@/features/expats/starterkit/StarterKitPage";

export const metadata = {
  title: "Starter Kit – Expats Mode",
  description:
    "Your personalized relocation starter kit with city analysis, budget, actions, risk indicators and scam protection.",
};

export default function StarterKitPageRoute() {
  return (
    <MainLayout>
      <StarterKitPage />
    </MainLayout>
  );
}
