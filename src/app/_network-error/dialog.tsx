import React from "react";
import { useGlobal } from "../_global";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNetworkError } from "../_side-effects/network-error";
import { useLocale, useTranslations } from "next-intl";

const NetworkErrorDialog = () => {
  const t = useTranslations("NetworkErrorDialog")
  const locale = useLocale()
  const isRtl = locale === 'fa'
  const { networkErrorOpen, setNetworkErrorOpen } = useGlobal();
  
  useNetworkError()

  return (
    <AlertDialog open={networkErrorOpen} onOpenChange={setNetworkErrorOpen}>
      <AlertDialogContent dir={isRtl ? "rtl" : "ltr"}>
        <AlertDialogHeader className="items-start">
          <AlertDialogTitle>{t("AlertDialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
          {t("AlertDialogDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className="self-end" onClick={() => window.location.reload()}>
          {t("AlertDialogAction")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NetworkErrorDialog;
