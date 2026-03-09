import type { Metadata } from "next";
import Link from "next/link";
import { getServerTranslator } from "@/i18n/server";
import { getSiteUrl } from "@/lib/siteUrl";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const baseUrl = getSiteUrl();
  const title = t("Join Syncro");
  const description = t(
    "People, places and experiences that fit you. Discover matches, explore the catalog, and connect. Create your free account.",
  );
  const shareUrl = baseUrl ? `${baseUrl}/share` : "/share";

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: "website",
      url: shareUrl,
      siteName: "Syncro",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: shareUrl },
  };
};

export default async function SharePage() {
  const { t } = await getServerTranslator();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col gap-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          {t("Someone shared Syncro with you")}
        </h1>
        <p className="text-muted">
          {t(
            "People, places and experiences that fit you. Discover matches, explore the catalog, and connect with Zyra.",
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-md hover:brightness-95 transition"
          >
            {t("Create account")}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-muted transition"
          >
            {t("Sign in")}
          </Link>
        </div>
      </div>
    </div>
  );
}
