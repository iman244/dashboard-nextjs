"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { localeDigits } from "@/lib/utils";
import { toast } from "sonner";
import { useDestroy_PatientEntry_API } from "@/data/patient-entry/api/destroy";
import type { PatientEntry } from "@/data/patient-entry/types";

export const DeleteRecordDialog = ({
  record,
  open,
  onOpenChange,
  onDeleted,
}: {
  record?: PatientEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}) => {
  const t = useTranslations("/console/monitorings.Records");
  const tDictionary = useTranslations("common.Dictionary");
  const locale = useLocale();

  const { mutate, isPending } = useDestroy_PatientEntry_API({
    onSuccess: () => {
      toast.success(t("Deleted"));
      onDeleted();
    },
    // Without this the dialog sits there unchanged on failure, which reads as
    // "nothing happened" and invites a second attempt.
    onError: () => toast.error(t("DeleteFailed")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("DeleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("DeleteDescription", {
              nationalId: localeDigits(record?.national_id ?? "", locale),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tDictionary("Cancel")}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isPending || !record}
            onClick={() => record && mutate({ id: record.id })}
          >
            {isPending ? <Spinner className="me-2 size-4" /> : null}
            {t("DeleteRecord")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
