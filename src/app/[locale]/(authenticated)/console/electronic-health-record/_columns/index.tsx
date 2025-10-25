import React from "react";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
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

const columnHelper = createColumnHelper<ElectronicHealthRecord>();

/**
 * Hook to get EHR table column definitions with locale-aware formatting
 * @param locale - The current locale ('fa' for Persian, 'en' for English)
 * @param onViewDetails - Callback function for viewing details
 * @returns Array of column definitions
 */
export const useEHRColumns = (
  {locale, onViewDetails}: {locale: string, onViewDetails?: (record: ElectronicHealthRecord) => void}) => {
  const router = useRouter();
  const { filters } = useElectronicHealthRecord();
  
  const handlePatientReport = React.useCallback((record: ElectronicHealthRecord) => {
    const now = new Date();
    const oneYearAgo = subYears(now, 1);
    
    const fromDate = format(filters.dateRange?.from || oneYearAgo, "yyyy/MM/dd");
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
  }, [router, filters.patientType, filters.dateRange?.from, filters.dateRange?.to]);
  
  return React.useMemo(() => [
    columnHelper.accessor("نام بيمار", {
      header: "نام و نام خانوادگی بیمار",
      cell: (info) => formatCellValue(`${info.getValue()} ${info.cell.row.original['نام خانوادگي بيمار']}`, locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("كدملي", {
      header: "کد ملی",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("تاريخ", {
      header: "تاریخ",
      cell: (info) => formatCellValue(info.getValue(), locale),
      enableSorting: true,
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("نام خدمت", {
      header: "نام خدمت",
      cell: (info) => (
        <div className="whitespace-normal break-words max-w-xs">
          {formatCellValue(info.getValue(), locale)}
        </div>
      ),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("نام پزشك معالج", {
      header: "نام پزشک معالج",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("مكان", {
      header: "مکان",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("PatientType", {
      header: "نوع بیمار",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    // Actions column
    columnHelper.display({
      id: "actions",
      header: "عملیات",
      cell: ({ row }) => {
        const record = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">باز کردن منو</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onViewDetails?.(record)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                مشاهده جزئیات
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePatientReport(record)}
                className="cursor-pointer"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                گزارش بیمار
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }) as ColumnDef<ElectronicHealthRecord>,
  ], [locale, onViewDetails, handlePatientReport]);
};
