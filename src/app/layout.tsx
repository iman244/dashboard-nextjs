import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Provider } from "./provider";
import { headers } from "next/headers";
import { Locale } from "next-intl";
import { directionOf, fontClassOf } from "@/lib/direction";
import { getLocale, getTranslations } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

/**
 * The title template every page inherits, so each page supplies only its own
 * name and the product's follows it.
 *
 * Read through getTranslations rather than written as a literal: every title in
 * this app was a hardcoded English string, so a Persian page's browser tab said
 * "Console" and its meta description repeated the app name.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "metadata.app" });

  return {
    title: { default: t("name"), template: `%s | ${t("name")}` },
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const fontClass = fontClassOf(locale);
  const dir = directionOf(locale);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} ${fontClass} antialiased`}
      >
        <Provider dir={dir}>{children}</Provider>
      </body>
    </html>
  );
}
