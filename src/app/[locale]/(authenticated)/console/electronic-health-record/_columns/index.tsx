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
  ];
};
