import { MainLayout } from "@/components/layout/MainLayout";

export const metadata = {
  title: "Professionals – Expats Mode",
  description: "Browse verified relocation professionals.",
};

export default function ExpatsProfessionalsPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">Professionals</h1>
        <p className="mt-4 text-muted-foreground">Coming soon. Verified professionals will appear here.</p>
      </div>
    </MainLayout>
  );
}
