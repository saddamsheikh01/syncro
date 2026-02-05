import type { Metadata } from "next";
import { MainLayout } from "@/components/layout/MainLayout";
import { ZyraChatFlow } from "@/features/zyra/flows/ZyraChatFlow";
import { ZyraSuggestionsFlow } from "@/features/zyra/flows/ZyraSuggestionsFlow";

export const metadata: Metadata = {
  title: "Zyra | Syncro",
  description: "Smart chat and personalized suggestions.",
};

export default function ZyraPage() {
  return (
    <MainLayout>
      <div className="space-y-6 px-4 pb-10 pt-6 lg:px-8">
        <ZyraChatFlow />
        <ZyraSuggestionsFlow />
      </div>
    </MainLayout>
  );
}
