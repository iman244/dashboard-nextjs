"use client";

import React from "react";
import UploadSaderatBankHealthMonitoringExcelDialog from "./_upload-excel-dialog/dialog";
import { Button } from "@/components/ui/button";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { appTableFeatures, type AppTableFeatures } from "@/components/app/table-features";
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
import { Table2, Trash, AlertCircle, Inbox } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import DeleteSaderatBankHealthMonitoringExcelDialog from "./_delete-excel-dialog/dialog";
import Link from "next/link";
import { useList_SBHM_API } from "@/data/saderat-bank-health-monitoring/api";
import {
  SBHM_ListSerializer,
  SBHM_TYPE_LABEL_KEY,
} from "@/data/saderat-bank-health-monitoring/types";

const columnHelper = createColumnHelper<AppTableFeatures, SBHM_ListSerializer[number]>();

const SaderatBankHealthMonitoringPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring">
) => {
  const [deleteRow, setDeleteRow] = React.useState<
    SBHM_ListSerializer[number] | null
  >(null);
  const { data, isPending, error } = useList_SBHM_API();
  const tDictionary = useTranslations("common.Dictionary");
  const t = useTranslations("/console/saderat-bank-health-monitoring.SaderatBankHealthMonitoringPage");
  const tStep = useTranslations("common.SBHM_Step");
  const locale = useLocale();
  const isRtl = locale === "fa";

  const table = useTable({
    features: appTableFeatures,
    columns: columnHelper.columns([
      columnHelper.accessor("name", {
        header: tDictionary("Name"),
        cell: (info) => localeDigits(info.getValue(), locale),
      }),
      // a name is only unique per step now, so the step has to be visible
      columnHelper.accessor("type", {
        header: tStep("Label"),
        cell: (info) => tStep(SBHM_TYPE_LABEL_KEY(info.getValue())),
      }),
      columnHelper.accessor("created_at", {
        header: tDictionary("CreatedAt"),
        cell: (info) =>
          localeDigits(formatDate(new Date(info.getValue()), locale), locale),
      }),
      columnHelper.display({
        header: tDictionary("Actions"),
        cell: ({ row }) => (
          <div className="flex gap-2 items-center">
            <Button variant={"ghost"} asChild>
              <Link
                href={`/console/saderat-bank-health-monitoring/${row.original.id}`}
              >
                <Table2 />
              </Link>
            </Button>
            <Button
              variant={"ghost"}
              onClick={() => setDeleteRow(row.original)}
            >
              <Trash />
            </Button>
          </div>
        ),
      }),
    ]),
    data: data || [],
  });

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <div className="flex items-center flex-col gap-3">
          <Spinner className="h-8 w-8" />
          <span className="text-muted-foreground">{t("Loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-destructive">{t("ErrorTitle")}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("EmptyStateTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {t("EmptyStateDescription")}
        </p>
      </div>
    );
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
                      : <table.FlexRender header={header} />}
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
                      <table.FlexRender cell={cell} />
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
