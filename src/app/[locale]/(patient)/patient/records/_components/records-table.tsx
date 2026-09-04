"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ColumnDef, ReactTable } from "@tanstack/react-table";
import { AlertCircle } from "lucide-react";
import { DataTable } from "@/components/app/data-table";
import { type AppTableFeatures } from "@/components/app/table-features";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";

const SKELETON_ROWS = 5;

interface RecordsTableProps {
  table: ReactTable<AppTableFeatures, ElectronicHealthRecord>;
  columns: ColumnDef<AppTableFeatures, ElectronicHealthRecord>[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onRetry: () => void;
}

/**
 * Loading and error states live here; the happy path delegates to the shared
 * DataTable, which already carries the sortable headers and RTL-safe chrome.
 */
export const RecordsTable = ({
  table,
  columns,
  isLoading,
  isError,
  error,
  onRetry,
}: RecordsTableProps) => {
  const t = useTranslations("/patient/records.PatientRecords");

  if (isLoading) {
    return (
      <div className="rounded-md border p-4 space-y-3">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-md border p-8 flex flex-col items-center gap-3 text-center"
      >
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-destructive">
          {t("table.error", { message: error?.message ?? "" })}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("table.retry")}
        </Button>
      </div>
    );
  }

  return (
    <DataTable
      table={table}
      columns={columns}
      noDataMessage={t("table.noData")}
    />
  );
};
