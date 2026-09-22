"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntryForm } from "@/components/app/patient-entry-form";
import type { MonitoringType } from "@/data/monitoring-type/types";

/**
 * Adding or revising one patient's record.
 *
 * The monitoring is already chosen -- it is the page you are on -- so the form
 * asks only for the national id and whatever fields the schema declares.
 */
export const RecordDialog = ({
  monitoring,
  open,
  onOpenChange,
  onSaved,
}: {
  monitoring: MonitoringType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) => {
  const t = useTranslations("/console/monitorings.Records");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("DialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("DialogDescription", { name: monitoring.name_fa })}
          </DialogDescription>
        </DialogHeader>
        <EntryForm
          monitoring={monitoring.id}
          type={monitoring}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
};
