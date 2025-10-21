import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { formatCellValue } from "../_utils/format-numbers";
import { MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const columnHelper = createColumnHelper<ElectronicHealthRecord>();

/**
 * Hook to get EHR table column definitions with locale-aware formatting
 * @param locale - The current locale ('fa' for Persian, 'en' for English)
 * @param onViewDetails - Callback function for viewing details
 * @returns Array of column definitions
 */
export const useEHRColumns = (
  locale: string,
  onViewDetails?: (record: ElectronicHealthRecord) => void
): ColumnDef<ElectronicHealthRecord>[] => {
  return [
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
      cell: (info) => formatCellValue(info.getValue(), locale),
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
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }) as ColumnDef<ElectronicHealthRecord>,
  ];
};
