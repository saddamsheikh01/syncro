import { MainLayout } from "@/components/layout/MainLayout";

export const metadata = {
  title: "Roadmap – Expats Mode",
  description: "Your 90-day relocation roadmap and integration phases.",
};

export default function ExpatsRoadmapPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-foreground">Roadmap</h1>
        <p className="mt-4 text-muted-foreground">Coming soon. Your personalized relocation roadmap will appear here.</p>
      </div>
    </MainLayout>
  );
}
