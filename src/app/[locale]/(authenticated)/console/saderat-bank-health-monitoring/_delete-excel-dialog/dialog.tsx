"use client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { LIST_SBHM_QUERY_KEY } from "@/data/saderat-bank-health-monitoring/api";
import { useDestroy_SBHM_API } from "@/data/saderat-bank-health-monitoring/api/destroy";
import { SBHM_ListSerializer } from "@/data/saderat-bank-health-monitoring/types";
import { localeDigits } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

const DeleteSaderatBankHealthMonitoringExcelDialog = ({
  data,
  open,
  onOpenChange,
}: {
  data?: SBHM_ListSerializer[number];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const t = useTranslations("/console/saderat-bank-health-monitoring.DeleteSaderatBankHealthMonitoringExcelDialog");
  const { mutate, isPending } =
   useDestroy_SBHM_API({
    onSuccess: () => {
      toast.success(t("SuccessMessage"));
      queryClient.invalidateQueries({
        queryKey: LIST_SBHM_QUERY_KEY(),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      // Without this the dialog stays open and unchanged on failure, which
      // reads as "nothing happened" and invites a second delete attempt.
      toast.error(t("ErrorMessage", { message: error.message }));
    },
  });
  const tDictionary = useTranslations("common.Dictionary");
  const locale = useLocale();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("DialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("DialogDescription", {
              name: localeDigits(data?.name ?? "", locale),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tDictionary("Cancel")}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() =>
              mutate({
                pathVariables: { id: data?.id ?? 0 },
              })
            }
            disabled={isPending}
          >
            {isPending && <Spinner />}
            {tDictionary("Delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteSaderatBankHealthMonitoringExcelDialog;
