import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { ZyraChatFlow } from "@/features/zyra/flows/ZyraChatFlow";
import { ZyraSuggestionsFlow } from "@/features/zyra/flows/ZyraSuggestionsFlow";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();

  return {
    title: t("Zyra | Syncro"),
    description: t("Smart chat and personalized suggestions."),
  };
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
