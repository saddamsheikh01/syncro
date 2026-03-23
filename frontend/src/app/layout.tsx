import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { I18nProvider } from "@/i18n/I18nProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, normalizeLocale } from "@/i18n/locales";
import { getServerTranslator } from "@/i18n/server";
import { getSiteUrl } from "@/lib/siteUrl";
import MetaPixel from "@/components/MetaPixel";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const baseUrl = getSiteUrl();
  const title = t("Syncro");
  const description = t(
    "People, places and experiences that fit you. Discover matches, explore the catalog, and connect with Zyra.",
  );

  const metadata: Metadata = {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    applicationName: title,
    metadataBase: new URL(baseUrl),
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: title,
      url: baseUrl,
      title,
      description,
      // Image from app/opengraph-image.tsx (PNG; SVG not supported by social crawlers)
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  return metadata;
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_KEY)?.value ?? null;
  const initialLocale = normalizeLocale(cookieLocale) ?? DEFAULT_LOCALE;

  return (
    <html lang={initialLocale}>
      <body className="antialiased">
        <MetaPixel />
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
