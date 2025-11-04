import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ButtonsSection from "./_components/ButtonsSection";

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

export default async function LandingPage(props: PageProps<"/[locale]">) {
  const t = await getTranslations("HomePage");
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="text-center">
          <CardHeader className="space-y-4">
            <CardTitle className="text-4xl font-bold tracking-tight">
              {t("title")}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {t("description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* client */}
            <ButtonsSection />
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
