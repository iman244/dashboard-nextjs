import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { flexRender, Table as TanStackTable, ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { LoadingSkeleton } from "./loading-skeleton";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";

interface EHRTableProps {
  table: TanStackTable<ElectronicHealthRecord>;
  columns: ColumnDef<ElectronicHealthRecord>[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}

/**
 * EHR Table component with loading, error, and data states
 */
export const EHRTable = ({ table, columns, isLoading, isError, error }: EHRTableProps) => {
  const t = useTranslations("EHRTable");

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-red-500"
              >
                خطا در بارگذاری داده‌ها:{" "}
                {error?.message}
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                {t("pagination.noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
