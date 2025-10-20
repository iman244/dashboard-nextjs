import { createColumnHelper, ColumnDef } from "@tanstack/react-table";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { formatCellValue } from "../_utils/format-numbers";

const columnHelper = createColumnHelper<ElectronicHealthRecord>();

/**
 * Hook to get EHR table column definitions with locale-aware formatting
 * @param locale - The current locale ('fa' for Persian, 'en' for English)
 * @returns Array of column definitions
 */
export const useEHRColumns = (locale: string): ColumnDef<ElectronicHealthRecord>[] => {
  return [
    columnHelper.accessor("نام بيمار", {
      header: "نام بیمار",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("نام خانوادگي بيمار", {
      header: "نام خانوادگی",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("كدملي", {
      header: "کد ملی",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("سن", {
      header: "سن",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("تاريخ", {
      header: "تاریخ",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("نام خدمت", {
      header: "نام خدمت",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
    columnHelper.accessor("نام پزشك معالج", {
      header: "نام پزشک",
      cell: (info) => formatCellValue(info.getValue(), locale),
    }) as ColumnDef<ElectronicHealthRecord>,
  ];
};
