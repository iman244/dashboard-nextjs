import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { pageMetadata } from "@/lib/metadata";
import ButtonsSection from "./_components/ButtonsSection";
import { DarkModeToggle } from "@/components/app/theme-toggle";
import { LanguageSwitcher } from "@/components/app/language-switcher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, "home");
}

export default async function LandingPage() {
  const t = await getTranslations("/.HomePage");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full flex items-center justify-start gap-2 p-6">
        <LanguageSwitcher />
        <DarkModeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl space-y-10">
          <div className="space-y-3 text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-xl text-muted-foreground font-light">
              {t("description")}
            </p>
          </div>

          <div className="w-16 h-px bg-border mx-auto" />

          <section aria-labelledby="choose-path-heading" className="space-y-5 text-center">
            <h2 id="choose-path-heading" className="text-xl font-semibold text-foreground">
              {t("choosePath")}
            </h2>
            <ButtonsSection />
          </section>

          <section aria-labelledby="staff-work-heading" className="border-t border-border pt-8 text-center space-y-2">
            <h2 id="staff-work-heading" className="text-base font-semibold text-foreground">
              {t("staffWork.title")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              {t("staffWork.description")}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
