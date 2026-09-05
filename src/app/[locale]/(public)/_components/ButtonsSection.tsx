"use client";

import { useAuth } from "@/app/_auth";
import { AuthenticationStatus } from "@/app/_auth/type";
import { AppRoutes, getAuthRedirectUrl } from "@/app/paths";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React from "react";

const ButtonsSection = () => {
  const t = useTranslations("/.HomePage");
  const { authStatus } = useAuth();
  const href =
    authStatus === AuthenticationStatus.Authenticated
      ? AppRoutes.CONSOLE
      : getAuthRedirectUrl(AppRoutes.CONSOLE);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild size="lg" className="min-w-[200px] px-8 py-6 text-base">
          <Link href={href}>{t("buttons.goToConsole")}</Link>
        </Button>

        {/*
          The patient portal has its own session, unrelated to the console's
          Django auth, so this link never depends on `authStatus` — a signed-in
          staff member and an anonymous visitor both get the same destination.
        */}
        <Button
          asChild
          size="lg"
          variant="outline"
          className="min-w-[200px] px-8 py-6 text-base"
        >
          <Link href={AppRoutes.PATIENT_SIGN_IN}>
            {t("buttons.patientSignIn")}
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{t("patientHint")}</p>
    </div>
  );
};

export default ButtonsSection;
