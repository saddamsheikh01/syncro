import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { I18nProvider } from "@/i18n/I18nProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, normalizeLocale } from "@/i18n/locales";
import { getServerTranslator } from "@/i18n/server";
import { getSiteUrl } from "@/lib/siteUrl";

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
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: title,
      title,
      description,
      images: [
        {
          url: baseUrl ? `${baseUrl}/new_logosvg.svg` : "/new_logosvg.svg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [baseUrl ? `${baseUrl}/new_logosvg.svg` : "/new_logosvg.svg"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  if (baseUrl) {
    metadata.metadataBase = new URL(baseUrl);
    metadata.openGraph = { ...metadata.openGraph, url: baseUrl } as Metadata["openGraph"];
  }

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
        <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
