"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTable } from "@tanstack/react-table";
import { LogOut, RefreshCw, XIcon } from "lucide-react";
import { appTableFeatures } from "@/components/app/table-features";
import { TablePagination } from "@/components/app/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, localeDigits } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { AppRoutes } from "@/app/paths";
import { usePatientSession } from "../../provider";
import { usePatientRecords } from "./provider";
import { usePatientRecordColumns } from "./_columns";
import { RecordsFilter } from "./_components/records-filter";
import { RecordsTable } from "./_components/records-table";

const Client = () => {
  const t = useTranslations("/patient/records.PatientRecords");
  const tPatientTypes = useTranslations(
    "/console/electronic-health-record.PatientTypes"
  );
  const locale = useLocale();
  const router = useRouter();
  const { signOut } = usePatientSession();
  const {
    nationalId,
    filters,
    setFilters,
    loadRecords,
    records_m,
    openDetail,
  } = usePatientRecords();

  const columns = usePatientRecordColumns({ onViewDetails: openDetail });

  const table = useTable({
    features: appTableFeatures,
    data: records_m.data || [],
    columns,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ id: "تاريخ", desc: true }],
    },
  });

  const handleSignOut = React.useCallback(() => {
    signOut();
    router.replace(AppRoutes.PATIENT_SIGN_IN);
  }, [router, signOut]);

  return (
    <main className="container mx-auto p-4 space-y-4 min-h-screen flex flex-col">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle", {
              nationalId: localeDigits(nationalId ?? "", locale),
            })}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="me-2 h-4 w-4" />
          {t("signOut")}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <RecordsFilter isLoading={records_m.isPending} />
        <Button
          onClick={loadRecords}
          variant="outline"
          size="sm"
          disabled={records_m.isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${records_m.isPending ? "animate-spin" : ""}`}
          />
          <span>{t("refresh")}</span>
        </Button>
      </div>

      {(filters.dateRange?.from || filters.patientType) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {t("activeFilters.label")}
          </span>
          {/* The date badge is not clearable: clearing it would mean an
              unbounded query, and the range always has a sensible default. */}
          {filters.dateRange?.from && filters.dateRange?.to && (
            <Badge variant="secondary">
              <span>{t("activeFilters.dateRange")}</span>
              <span className="ms-1">
                {localeDigits(
                  `${formatDate(filters.dateRange.from, locale)} - ${formatDate(
                    filters.dateRange.to,
                    locale
                  )}`,
                  locale
                )}
              </span>
            </Badge>
          )}
          {filters.patientType && (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setFilters({ ...filters, patientType: "" })}
            >
              <XIcon className="w-4 h-4" />
              <span>{t("activeFilters.patientType")}</span>
              <span className="ms-1">{tPatientTypes(filters.patientType)}</span>
            </Badge>
          )}
        </div>
      )}

      <div className="flex-1">
        <RecordsTable
          table={table}
          columns={columns}
          isLoading={records_m.isPending}
          isError={records_m.isError}
          error={records_m.error}
          onRetry={loadRecords}
        />
      </div>

      <TablePagination table={table} />
    </main>
  );
};

export default Client;
