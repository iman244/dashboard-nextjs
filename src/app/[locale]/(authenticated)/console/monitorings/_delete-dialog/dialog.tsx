"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  LIST_MONITORING_TYPE_QUERY_KEY,
  useDestroy_MonitoringType_API,
} from "@/data/monitoring-type/api";
import { MonitoringType } from "@/data/monitoring-type/types";
import { localeDigits } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import React from "react";
import { toast } from "sonner";

/** What the server said when it refused, if it refused because of usage. */
type InUse = { detail?: string; monitorings?: number };

/**
 * Delete a monitoring type.
 *
 * The interesting case is the refusal. The foreign key from a monitoring to
 * its type is PROTECT, so the server answers 409 with the number of reports
 * still pointing at it. That is not an error to dismiss — it is the answer to
 * "why can't I delete this", and it names the work to do first. So it stays
 * in the open dialog rather than going to a toast that scrolls away before it
 * is read.
 */
const DeleteMonitoringTypeDialog = ({
  data,
  open,
  onOpenChange,
}: {
  data?: MonitoringType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const t = useTranslations("/console/monitorings.DeleteMonitoringTypeDialog");
  const tDictionary = useTranslations("common.Dictionary");
  const locale = useLocale();

  // A refusal belongs to the row it was about, so it is stored with that row's
  // id and read back only for a matching row. Derived rather than cleared in an
  // effect: an effect that calls setState runs a second render every time the
  // dialog opens, and it can only ever approximate "this banner is about the
  // type currently on screen" -- which is what the comparison below states
  // outright.
  const [inUseFor, setInUseFor] = React.useState<{
    id: number;
    body: InUse;
  } | null>(null);
  const inUse = inUseFor && data?.id === inUseFor.id ? inUseFor.body : null;

  // Closing is the one moment a stale refusal should be forgotten: the row may
  // have been made deletable in the meantime. An event handler, not an effect.
  const handleOpenChange = (next: boolean) => {
    if (!next) setInUseFor(null);
    onOpenChange(next);
  };

  const { mutate, isPending } = useDestroy_MonitoringType_API({
    onSuccess: () => {
      toast.success(t("SuccessMessage"));
      queryClient.invalidateQueries({
        queryKey: LIST_MONITORING_TYPE_QUERY_KEY(),
      });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error.response?.status === 409 && data) {
        setInUseFor({ id: data.id, body: error.response.data ?? {} });
        return;
      }
      // Anything else is unexpected, and leaving the dialog unchanged would
      // read as "nothing happened" and invite a second attempt.
      toast.error(t("ErrorMessage", { message: error.message }));
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("DialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("DialogDescription", { name: data?.name_en ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {inUse && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden="true" className="h-4 w-4" />
            <AlertTitle>{t("InUseTitle")}</AlertTitle>
            <AlertDescription>
              {/* The count is what tells the user what to do next, so prefer
                  it over the server's prose. Fall back to `detail` when the
                  body arrives without one. */}
              {typeof inUse.monitorings === "number"
                ? t("InUseDescription", {
                    count: localeDigits(String(inUse.monitorings), locale),
                  })
                : inUse.detail ?? t("InUseDescriptionUnknown")}
            </AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tDictionary("Cancel")}
          </AlertDialogCancel>
          {/* Stays enabled after a refusal: the user may go and delete the
              blocking reports, then come back and try again. */}
          <Button
            variant="destructive"
            onClick={() =>
              data && mutate({ pathVariables: { id: data.id } })
            }
            disabled={isPending || !data}
            aria-busy={isPending}
          >
            {isPending && <Spinner />}
            {tDictionary("Delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMonitoringTypeDialog;
