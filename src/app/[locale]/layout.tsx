import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";


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

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}));
  }

export default async function LocaleLayout({ children, params }: Props) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);


  return (

    <div className={locale === 'fa' ? 'font-persian' : 'font-english'}>
      <NextIntlClientProvider>{children}</NextIntlClientProvider>
    </div>
  );
}
