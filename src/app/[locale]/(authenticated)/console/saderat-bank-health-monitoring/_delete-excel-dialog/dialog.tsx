"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
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
  const t = useTranslations("DeleteSaderatBankHealthMonitoringExcelDialog");
  const { mutate, isPending } =
   useDestroy_SBHM_API({
    onSuccess: () => {
      toast.success(t("SuccessMessage"));
      queryClient.invalidateQueries({
        queryKey: LIST_SBHM_QUERY_KEY(),
      });
      onOpenChange(false);
    },
  });
  const tDictionary = useTranslations("Dictionary");
  const locale = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("DialogTitle")}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {t("DialogDescription", {
            name: localeDigits(data?.name ?? "", locale),
          })}
        </DialogDescription>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tDictionary("Cancel")}</Button>
          </DialogClose>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSaderatBankHealthMonitoringExcelDialog;
