import type { Metadata } from "next";
import { getServerTranslator } from "@/i18n/server";
import { MainLayout } from "@/components/layout/MainLayout";
import { ZyraChatFlow } from "@/features/zyra/flows/ZyraChatFlow";
import { ZyraSuggestionsFlow } from "@/features/zyra/flows/ZyraSuggestionsFlow";
import { getSiteUrl } from "@/lib/siteUrl";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const baseUrl = getSiteUrl();
  const zyraUrl = baseUrl ? `${baseUrl}/zyra` : "/zyra";
  const title = t("Zyra | Syncro");
  const description = t("Smart chat and personalized suggestions.");

  return {
    title,
    description,
    metadataBase: baseUrl ? new URL(baseUrl) : undefined,
    openGraph: {
      type: "website",
      url: zyraUrl,
      siteName: "Syncro",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: zyraUrl },
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
