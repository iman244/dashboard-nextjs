"use client";

import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { type AppTableFeatures } from "@/components/app/table-features";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { formatCellValue } from "@/lib/utils";
import { Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "next-intl";

const columnHelper = createColumnHelper<
  AppTableFeatures,
  ElectronicHealthRecord
>();

/**
 * Columns for a patient looking at their own records.
 *
 * Deliberately narrower than the console's set: the patient's name and national
 * id are not columns, because every row is the same person and repeating them
 * would be noise. The only row action is "view details" — the console's
 * "patient report" action points at /console/patient-reports, which a patient
 * cannot open.
 *
 * The Persian keys below use Arabic ي/ك and must match the upstream payload
 * byte for byte. See src/data/electronic health record/type.ts.
 */
export const usePatientRecordColumns = ({
  onViewDetails,
}: {
  onViewDetails: (record: ElectronicHealthRecord) => void;
}) => {
  const t = useTranslations("/patient/records.PatientRecords");
  const locale = useLocale();
  const isRtl = locale === "fa";

  return React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("تاريخ", {
          header: t("columns.date"),
          cell: (info) => formatCellValue(info.getValue(), locale),
          enableSorting: true,
        }),
        columnHelper.accessor("نام خدمت", {
          header: t("columns.service"),
          cell: (info) => (
            <div className="whitespace-normal break-words max-w-xs">
              {formatCellValue(info.getValue(), locale)}
            </div>
          ),
        }),
        columnHelper.accessor("نام پزشك معالج", {
          header: t("columns.doctor"),
          cell: (info) => formatCellValue(info.getValue(), locale),
        }),
        columnHelper.accessor("مكان", {
          header: t("columns.place"),
          cell: (info) => formatCellValue(info.getValue(), locale),
        }),
        columnHelper.accessor("PatientType", {
          header: t("columns.patientType"),
          cell: (info) => formatCellValue(info.getValue(), locale),
        }),
        columnHelper.display({
          id: "actions",
          header: t("columns.actions"),
          cell: ({ row }) => (
            <DropdownMenu dir={isRtl ? "rtl" : "ltr"}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("actions.openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => onViewDetails(row.original)}
                  className="cursor-pointer"
                >
                  <Eye className="me-2 h-4 w-4" />
                  {t("actions.viewDetails")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        }),
      ]),
    [t, locale, isRtl, onViewDetails]
  );
};
