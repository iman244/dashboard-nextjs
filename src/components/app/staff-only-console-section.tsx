"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingState } from "@/components/app/loading-state";
import { Button } from "@/components/ui/button";
import { useMe_API } from "@/data/user/fetches/me";

/** Keeps staff-only console pages unmounted until the account role is known. */
export function StaffOnlyConsoleSection({ children }: { children: ReactNode }) {
  const t = useTranslations("common.StaffAccess");
  const { data: user, isPending, isError, refetch } = useMe_API();

  if (isPending) return <LoadingState label={t("checking")} />;
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" className="size-4" />
        <AlertTitle>{t("checkFailedTitle")}</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>{t("checkFailedDescription")}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            {t("retry")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (user?.is_staff !== true) {
    return (
      <Alert>
        <AlertCircle aria-hidden="true" className="size-4" />
        <AlertTitle>{t("title")}</AlertTitle>
        <AlertDescription>{t("description")}</AlertDescription>
      </Alert>
    );
  }

  return children;
}
