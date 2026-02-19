import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { I18nProvider } from "@/i18n/I18nProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, normalizeLocale } from "@/i18n/locales";
import { getServerTranslator } from "@/i18n/server";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.syncroapp.it";

export const generateMetadata = async (): Promise<Metadata> => {
  const { t } = await getServerTranslator();
  const title = t("Syncro");
  const description = t(
    "People, places and experiences that fit you. Discover matches, explore the catalog, and connect with Zyra.",
  );
  const canonicalUrl = SITE_URL.replace(/\/+$/, "");
  const ogImageUrl = `${canonicalUrl}/icon`;

  return {
    metadataBase: new URL(canonicalUrl),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    applicationName: title,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonicalUrl,
      siteName: title,
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 512,
          height: 512,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
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
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
