"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppRoutes, getAuthRedirectUrl } from "../../paths";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/app/_auth";
import { AuthenticationStatus } from "@/app/_auth/type";

const Client = () => {
  const t = useTranslations("HomePage");
  const { authStatus } = useAuth();
  const href =
    authStatus === AuthenticationStatus.Authenticated
      ? AppRoutes.CONSOLE
      : getAuthRedirectUrl(AppRoutes.CONSOLE);

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
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="flex-1 sm:flex-none">
                <Link href={href}>{t("buttons.goToConsole")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Client;
