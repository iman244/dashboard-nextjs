"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { localeDigits } from "@/lib/utils";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api/list";
import { SBHM_ListSerializer } from "@/data/saderat-bank-health-monitoring/types";
import { EntryForm } from "./entry-form";

/**
 * The per-patient upload form for one monitoring.
 *
 * The row only carries its type as a slug, so the type record -- and with it
 * `field_schema` -- is looked up from the types list, which the console has
 * usually already cached.
 */
const PatientEntryDialog = ({
  data,
  open,
  onOpenChange,
}: {
  data?: SBHM_ListSerializer[number];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.PatientEntryDialog"
  );
  const locale = useLocale();
  const { data: types } = useList_MonitoringType_API();
  const type = types?.find((candidate) => candidate.slug === data?.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("DialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("DialogDescription", {
              name: localeDigits(data?.name ?? "", locale),
            })}
          </DialogDescription>
        </DialogHeader>
        {data ? <EntryForm monitoring={data.id} type={type} /> : null}
      </DialogContent>
    </Dialog>
  );
};

export default PatientEntryDialog;
