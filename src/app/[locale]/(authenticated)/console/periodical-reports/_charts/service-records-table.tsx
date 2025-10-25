"use client";

import React, { useMemo } from "react";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/app";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import { formatNumber, localeDigits } from "@/lib/utils";
import { EHRDetailModal } from "@/data/electronic health record/components/EHRDetailModal";
import { usePeriodicalReports } from "../provider";
import { TablePagination } from "@/components/app/table-pagination";
import { format, subYears } from "date-fns-jalali";
import { useRouter } from "@/i18n/navigation";

interface ServiceRecordsTableProps {
  data: ElectronicHealthRecord[];
  selectedService: string | null;
}
const fallbackdata: ElectronicHealthRecord[] = [];
const columnHelper = createColumnHelper<ElectronicHealthRecord>();

export const ServiceRecordsTable: React.FC<ServiceRecordsTableProps> = ({
  data,
  selectedService,
}) => {
  const t = useTranslations("data");
  const tSRT = useTranslations("ServiceRecordsTable");
  const locale = useLocale();
  const router = useRouter();

  const {
    filters,
    mobileLaboratoryByNationalNumber_m,
    mobileXRayByNationalNumber_m,
    mobileNumberByNationalNumber_m,
    selectedRecord,
    setSelectedRecord,
    isDetailModalOpen,
    setIsDetailModalOpen,
  } = usePeriodicalReports();

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

  const columns = useMemo(
    () => [
      columnHelper.accessor("نام بيمار", {
        header: t("patientName"),
        cell: (info) => (
          <span>
            {info.getValue() + info.row.original["نام خانوادگي بيمار"]}
          </span>
        ),
      }),
      columnHelper.accessor("جواب", {
        header: t("answer"),
        cell: (info) => (
          <span>{localeDigits(info.getValue()?.toString() || "", locale)}</span>
        ),
      }),
      columnHelper.accessor("نرمال رنج", {
        header: t("normalRange"),
        cell: (info) => (
          <span>{localeDigits(info.getValue()?.toString() || "", locale)}</span>
        ),
      }),
      columnHelper.accessor("جواب", {
        id: "answerStatus",
        header: tSRT("answerStatus"),
        enableSorting: true,
        cell: (info) => {
          const answer = info.row.original["جواب"];
          const normalRange = info.row.original["نرمال رنج"];
          if (!answer || !normalRange) return null;

          const answerValue = parseFloat(answer);
          const rangeParts = normalRange.split("-");
          if (rangeParts.length !== 2) return null;

          const minRange = parseFloat(rangeParts[0]);
          const maxRange = parseFloat(rangeParts[1]);

          return (
            <div className="flex items-center gap-2">
              {answerValue >= minRange && answerValue <= maxRange ? (
                <Badge variant="secondary">{tSRT("normal")}</Badge>
              ) : (
                <Badge variant="destructive">{tSRT("abnormal")}</Badge>
              )}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const answerA = rowA.original["جواب"];
          const normalRangeA = rowA.original["نرمال رنج"];
          const answerB = rowB.original["جواب"];
          const normalRangeB = rowB.original["نرمال رنج"];

          // Handle cases where data is missing
          if (!answerA || !normalRangeA) return 1;
          if (!answerB || !normalRangeB) return -1;

          const answerValueA = parseFloat(answerA);
          const answerValueB = parseFloat(answerB);

          // Parse range for row A
          const rangePartsA = normalRangeA.split("-");
          if (rangePartsA.length !== 2) return 1;
          const minRangeA = parseFloat(rangePartsA[0]);
          const maxRangeA = parseFloat(rangePartsA[1]);

          // Parse range for row B
          const rangePartsB = normalRangeB.split("-");
          if (rangePartsB.length !== 2) return -1;
          const minRangeB = parseFloat(rangePartsB[0]);
          const maxRangeB = parseFloat(rangePartsB[1]);

          // Determine status for each row
          const getStatusPriority = (
            answer: number,
            minRange: number,
            maxRange: number
          ) => {
            if (answer > maxRange) return 1; // Above normal range - highest priority
            if (answer < minRange) return 2; // Below normal range - second priority
            return 3; // Within normal range - lowest priority
          };

          const priorityA = getStatusPriority(
            answerValueA,
            minRangeA,
            maxRangeA
          );
          const priorityB = getStatusPriority(
            answerValueB,
            minRangeB,
            maxRangeB
          );

          // First sort by priority (above > below > within)
          if (priorityA !== priorityB) {
            return priorityA - priorityB;
          }

          // If same priority, sort by the actual difference from normal range
          const getDeviation = (
            answer: number,
            minRange: number,
            maxRange: number
          ) => {
            if (answer > maxRange) return answer - maxRange; // How much above
            if (answer < minRange) return minRange - answer; // How much below
            return 0; // Within range
          };

          const deviationA = getDeviation(answerValueA, minRangeA, maxRangeA);
          const deviationB = getDeviation(answerValueB, minRangeB, maxRangeB);

          return deviationB - deviationA; // Larger deviations first within same priority
        },
      }),
      columnHelper.accessor("نام خدمت", {
        header: t("serviceName"),
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.accessor("نام پزشك معالج", {
        header: t("treatingPhysician"),
        cell: (info) => <span>{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: "actions",
        header: "عملیات",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedRecord(info.row.original);
                console.log("info.row.original", info.row.original);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePatientReport(info.row.original)}
              title="گزارش بیمار"
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        ),
      }),
    ],
    [t, tSRT, locale, setSelectedRecord, handlePatientReport]
  );

  console.log({ columns });

  // Filter records by selected service
  const filteredRecords = React.useMemo(() => {
    if (!selectedService || !data) return [];

    return data.filter((record) => record["نام خدمت"] === selectedService);
  }, [data, selectedService]);

  const table = useReactTable({
    data: filteredRecords || fallbackdata,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Header with service info */}
      {/* <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            رکوردهای خدمت: {selectedService}
          </h3>
          <Badge variant="secondary">
            {digitsEnToFa(filteredRecords.length.toString())} رکورد
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          روی نمودار کلیک کنید تا خدمت دیگری انتخاب شود
        </div>
      </div> */}

      <DataTable<ElectronicHealthRecord, string>
        table={table}
        columns={columns}
        className="text-xs!"
      />
      <TablePagination
        table={table}
        formatNumber={(num) => formatNumber(num, locale)}
        showPageSizeSelector={false}
      />

      <EHRDetailModal
        record={selectedRecord}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
        actions={{
          mobileLaboratoryByNationalNumber_m,
          mobileXRayByNationalNumber_m,
          mobileNumberByNationalNumber_m,
        }}
      />
    </div>
  );
};
