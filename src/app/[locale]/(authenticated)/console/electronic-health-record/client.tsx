"use client";

import {
  ehr_by_national_number,
  EHR_BY_NATIONAL_NUMBER_KEY,
} from "@/data/electronic health record/api/EHR-by-national-number";
import { useMutation, useQuery } from "@tanstack/react-query";
import React from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// Import extracted components and utilities
import { useEHRColumns } from "./_columns";
import { EHRTable } from "./_components/ehr-table";
import { EHRTablePagination } from "./_components/ehr-table-pagination";
import { EHRFilter } from "./_components/ehr-filter";
import { formatNumber } from "./_utils/format-numbers";
import { useElectronicHealthRecord } from "./provider";
import { format } from "date-fns-jalali";

/**
 * Main EHR Client Component
 * Handles data fetching and composes sub-components
 */
const Client = () => {
  const t = useTranslations("EHRTable");
  const locale = useLocale();
  const [lastMutation, setLastMutation] = React.useState(null);

  // Filter state
  const { filters, ehrByNationalNumber_m, callMutation } = useElectronicHealthRecord();


  // Column definitions with locale-aware formatting
  const columns = useEHRColumns(locale);

  // Table instance
  const table = useReactTable({
    data: ehrByNationalNumber_m.data || [],
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header with title and refresh button */}
      <h2 className="text-2xl font-bold">{t("title")}</h2>

      {/* Filter Section */}

      <div className="flex items-center justify-between">
        <EHRFilter isLoading={ehrByNationalNumber_m.isPending} />
        <Button
          onClick={callMutation}
          variant="outline"
          size="sm"
          disabled={ehrByNationalNumber_m.isPending}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              ehrByNationalNumber_m.isPending ? "animate-spin" : ""
            }`}
          />
          <span>بروزرسانی</span>
        </Button>
      </div>

      {/* Table with flex-1 to take remaining space */}
      <div className="flex-1">
        <EHRTable
          table={table}
          columns={columns}
          isLoading={ehrByNationalNumber_m.isPending}
          isError={ehrByNationalNumber_m.isError}
          error={ehrByNationalNumber_m.error}
        />
      </div>

      {/* Pagination */}
      <EHRTablePagination
        table={table}
        formatNumber={(num) => formatNumber(num, locale)}
      />
    </div>
  );
};

export default Client;
