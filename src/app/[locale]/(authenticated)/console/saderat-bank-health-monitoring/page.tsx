"use client";

import React from "react";
import UploadSaderatBankHealthMonitoringExcelDialog from "./_upload-excel-dialog/dialog";
import { Button } from "@/components/ui/button";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocale, useTranslations } from "next-intl";
import { cn, formatDate, localeDigits } from "@/lib/utils";
import { Table2, Trash } from "lucide-react";
import DeleteSaderatBankHealthMonitoringExcelDialog from "./_delete-excel-dialog/dialog";
import Link from "next/link";
import { useList_SBHM_API } from "@/data/saderat-bank-health-monitoring/api";
import { SBHM_ListSerializer } from "@/data/saderat-bank-health-monitoring/types";

const columnHelper =
  createColumnHelper<SBHM_ListSerializer[number]>();

const SaderatBankHealthMonitoringPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring">
) => {
  const [deleteRow, setDeleteRow] = React.useState<
    SBHM_ListSerializer[number] | null
  >(null);
  const { data, isPending, error } = useList_SBHM_API();
  const tDictionary = useTranslations("Dictionary");
  const t = useTranslations("SaderatBankHealthMonitoringPage");
  const locale = useLocale();
  const isRtl = locale === "fa";

  const table = useReactTable({
    columns: [
      columnHelper.accessor("name", {
        header: tDictionary("Name"),
        cell: (info) => localeDigits(info.getValue(), locale),
      }),
      columnHelper.accessor("created_at", {
        header: tDictionary("CreatedAt"),
        cell: (info) =>
          localeDigits(formatDate(info.getValue(), locale), locale),
      }),
      columnHelper.display({
        header: tDictionary("Actions"),
        cell: ({ row }) => (
          <div className="flex gap-2 items-center">
            <Button
              variant={"ghost"}
              onClick={() => setDeleteRow(row.original)}
            >
              <Trash />
            </Button>
            <Button variant={"ghost"} asChild>
              <Link
                href={`/console/saderat-bank-health-monitoring/${row.original.id}`}
              >
                <Table2 />
              </Link>
            </Button>
          </div>
        ),
      }),
    ],
    data: data || [],
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return <div>No data</div>;
  }

  return (
    <div className="space-y-4">
      <UploadSaderatBankHealthMonitoringExcelDialog
        trigger={<Button>{t("UploadExcel")}</Button>}
      />
      <DeleteSaderatBankHealthMonitoringExcelDialog
        data={deleteRow || undefined}
        open={!!deleteRow}
        onOpenChange={(open) => setDeleteRow(open ? deleteRow : null)}
      />
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(isRtl ? "text-right" : "text-left")}
                  >
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
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
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  {tDictionary("NoResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SaderatBankHealthMonitoringPage;
