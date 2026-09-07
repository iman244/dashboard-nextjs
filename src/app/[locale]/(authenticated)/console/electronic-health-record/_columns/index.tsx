import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { type AppTableFeatures } from "@/components/app/table-features";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { formatCellValue } from "@/lib/utils";
import { MoreHorizontal, Eye, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import { format, subYears } from "date-fns-jalali";
import { useElectronicHealthRecord } from "../provider";
import { useIsRtl } from "@/lib/use-direction";
import { useTranslations } from "next-intl";

const columnHelper = createColumnHelper<AppTableFeatures, ElectronicHealthRecord>();

/**
 * Hook to get EHR table column definitions with locale-aware formatting
 * @param locale - The current locale ('fa' for Persian, 'en' for English)
 * @param onViewDetails - Callback function for viewing details
 * @returns Array of column definitions
 */
export const useEHRColumns = ({
  locale,
  onViewDetails,
}: {
  locale: string;
  onViewDetails?: (record: ElectronicHealthRecord) => void;
}) => {
  const router = useRouter();
  const tDictionary = useTranslations("common.Dictionary");
  // Note the case: `common.Dictionary` is the shared table vocabulary
  // (Actions, …) and `common.dictionary` is the EHR payload's field names.
  // Two namespaces one letter apart — using the wrong one renders the literal
  // key on screen and still passes tsc and lint.
  const tField = useTranslations("common.dictionary");
  const { filters } = useElectronicHealthRecord();
  const isRtl = useIsRtl();

  const handlePatientReport = React.useCallback(
    (record: ElectronicHealthRecord) => {
      const now = new Date();
      const oneYearAgo = subYears(now, 1);

      const fromDate = format(
        filters.dateRange?.from || oneYearAgo,
        "yyyy/MM/dd"
      );
      const toDate = format(filters.dateRange?.to || now, "yyyy/MM/dd");
      const nationalNumber = record["كدملي"];
      const patientType = filters.patientType; // Use the current patientType from EHR filters

      const searchParams = new URLSearchParams({
        nationalNumber,
        fromDate,
        toDate,
        patientType,
      });

      router.push(`/console/patient-reports?${searchParams.toString()}`);
    },
    [
      router,
      filters.patientType,
      filters.dateRange?.from,
      filters.dateRange?.to,
    ]
  );

  return React.useMemo(
    () => columnHelper.columns([
      columnHelper.accessor("نام بيمار", {
        header: tField("patientFullName"),
        cell: (info) =>
          formatCellValue(
            `${info.getValue()} ${
              info.cell.row.original["نام خانوادگي بيمار"]
            }`,
            locale
          ),
      }),
      columnHelper.accessor("كدملي", {
        header: tField("nationalId"),
        cell: (info) => formatCellValue(info.getValue(), locale),
      }),
      columnHelper.accessor("تاريخ", {
        header: tField("date"),
        cell: (info) => formatCellValue(info.getValue(), locale),
        enableSorting: true,
      }),
      columnHelper.accessor("نام خدمت", {
        header: tField("serviceName"),
        cell: (info) => (
          <div className="whitespace-normal break-words max-w-xs">
            {formatCellValue(info.getValue(), locale)}
          </div>
        ),
      }),
      columnHelper.accessor("نام پزشك معالج", {
        header: tField("treatingPhysician"),
        cell: (info) => formatCellValue(info.getValue(), locale),
      }),
      columnHelper.accessor("مكان", {
        header: tField("location"),
        cell: (info) => formatCellValue(info.getValue(), locale),
      }),
      columnHelper.accessor("PatientType", {
        header: tField("patientType"),
        cell: (info) => formatCellValue(info.getValue(), locale),
      }),
      // Actions column
      columnHelper.display({
        id: "actions",
        header: tDictionary("Actions"),
        cell: ({ row }) => {
          const record = row.original;

          return (
            <DropdownMenu dir={isRtl ? "rtl" : "ltr"}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{tDictionary("OpenMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => onViewDetails?.(record)}
                  className="cursor-pointer"
                >
                  <Eye aria-hidden="true" className="me-2 h-4 w-4" />
                  {tDictionary("ViewDetails")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlePatientReport(record)}
                  className="cursor-pointer"
                >
                  <BarChart3 aria-hidden="true" className="me-2 h-4 w-4" />
                  {tDictionary("PatientReport")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      }),
    ]),
    [locale, onViewDetails, handlePatientReport, isRtl, tDictionary, tField]
  );
};
