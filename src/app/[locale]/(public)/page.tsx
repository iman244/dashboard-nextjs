import { getTranslations } from "next-intl/server";
import ButtonsSection from "./_components/ButtonsSection";
import { DarkModeToggle } from "./_components/DarkModeToggle";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FileText, BarChart, User, ChevronLeft, ChevronRight } from "lucide-react";
import { getLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
  };
}

export default async function LandingPage() {
  const t = await getTranslations("HomePage");
  const locale = await getLocale();
  const isRTL = locale === "fa";
  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with dark mode toggle */}
      <header className="w-full flex justify-start p-6">
        <DarkModeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl space-y-10">
          {/* Title section */}
          <div className="space-y-3 text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-xl text-muted-foreground font-light">
              {t("description")}
            </p>
          </div>

          {/* Divider */}
          <div className="w-16 h-px bg-border mx-auto" />

          {/* Action section */}
          <div className="pt-2 text-center">
            <ButtonsSection />
          </div>

          {/* Features section */}
          <section aria-labelledby="features-heading" className="pt-2">
            <h2 id="features-heading" className="sr-only">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    {t("features.ehr.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {t("features.ehr.description")}
                  </CardDescription>
                  <div className="pt-3">
                    <Button asChild variant="link" size="sm" className="p-0 h-auto">
                      <Link href="/console/electronic-health-record">
                        {t("features.cta")} <Chevron className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    {t("features.periodical.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {t("features.periodical.description")}
                  </CardDescription>
                  <div className="pt-3">
                    <Button asChild variant="link" size="sm" className="p-0 h-auto">
                      <Link href="/console/periodical-reports">
                        {t("features.cta")} <Chevron className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    {t("features.patient.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {t("features.patient.description")}
                  </CardDescription>
                  <div className="pt-3">
                    <Button asChild variant="link" size="sm" className="p-0 h-auto">
                      <Link href="/console/patient-reports">
                        {t("features.cta")} <Chevron className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
