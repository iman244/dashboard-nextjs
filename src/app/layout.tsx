import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Provider } from "./provider";
import { headers } from "next/headers";
import { Locale } from "next-intl";
import { getLocale } from "next-intl/server";

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

export const metadata: Metadata = {
  title: "Infirmary Dashboard",
  description: "Infirmary Dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const fontClass = locale === "fa" ? "font-persian" : "font-english";

  return (
    <html suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} ${fontClass} antialiased`}
      >
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
