"use client";

import { useAuth } from "@/app/_auth";
import { AuthenticationStatus } from "@/app/_auth/type";
import { AppRoutes, getAuthRedirectUrl } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React from "react";

const ButtonsSection = () => {
  const t = useTranslations("HomePage");
  const { authStatus } = useAuth();
  const href =
    authStatus === AuthenticationStatus.Authenticated
      ? AppRoutes.CONSOLE
      : getAuthRedirectUrl(AppRoutes.CONSOLE);

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button asChild size="lg" className="flex-1 sm:flex-none">
        <Link href={href}>{t("buttons.goToConsole")}</Link>
      </Button>
    </div>
  );
};

export default ButtonsSection;
