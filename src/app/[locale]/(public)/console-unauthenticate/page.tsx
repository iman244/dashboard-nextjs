"use client";

import { getAuthRedirectUrl } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React from "react";

const ConsoleUnauthenticate = () => {
  const t = useTranslations("AuthenticatedGroupLayout");
  const pathname = usePathname();
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-screen mx-auto">
      <div className="space-y-2">
        <p className="text-center! text-lg font-medium text-foreground">
          {t("description1")}
        </p>
        <p className="text-center! text-sm text-muted-foreground">
          {t("description2")}
        </p>
      </div>
      <Button size="lg" asChild>
        <Link href={getAuthRedirectUrl(pathname)}>{t("redirectToLogin")}</Link>
      </Button>
    </div>
  );
};

export default ConsoleUnauthenticate;
