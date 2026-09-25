"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingState } from "@/components/app/loading-state";
import { useMe_API } from "@/data/user/fetches/me";

/**
 * Renders its children only for staff.
 *
 * For pages whose whole purpose is a change -- a new or edited record, a new
 * or edited monitoring. Django refuses those writes from anyone else anyway;
 * this stops a non-staff user filling in a form only to be refused on save.
 */
export const StaffOnly = ({ children }: { children: ReactNode }) => {
  const t = useTranslations("common.StaffOnly");
  const tLoading = useTranslations("common.Loading");
  const me = useMe_API();

  if (me.isPending) return <LoadingState label={tLoading("default")} />;

  if (me.data?.is_staff !== true) {
    return (
      <Alert>
        <ShieldAlert className="size-4" aria-hidden="true" />
        <AlertTitle>{t("Title")}</AlertTitle>
        <AlertDescription>{t("Description")}</AlertDescription>
      </Alert>
    );
  }

  return children;
};
