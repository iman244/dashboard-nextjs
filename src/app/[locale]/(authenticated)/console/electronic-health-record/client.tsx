"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useLocaleDigits } from "@/lib/use-locale-digits";
import { useTable } from "@tanstack/react-table";
import { appTableFeatures } from "@/components/app/table-features";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";
import { RefreshCw, XIcon } from "lucide-react";

import { useEHRColumns } from "./_columns";
import { EHRTable } from "./_components/ehr-table";
import { EHRTablePagination } from "./_components/ehr-table-pagination";
import { EHRFilter } from "./_components/ehr-filter";
import { EHRDetailModal } from "@/data/electronic health record/components/EHRDetailModal";
import { formatNumber, formatDate } from "@/lib/utils";
import { useElectronicHealthRecord } from "./provider";
import { ElectronicHealthRecord } from "@/data/electronic health record/type";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { fullNationalId, isNationalId, PATIENT_PATH } from "@/lib/national-id";

const Client = () => {
  const t = useTranslations("/console/electronic-health-record.EHRTable");
  const fmt = useLocaleDigits();
  const tPatientTypes = useTranslations("common.PatientTypes");
  const locale = useLocale();
  const router = useRouter();
  const [openPatientId, setOpenPatientId] = React.useState("");
  const [openPatientInvalid, setOpenPatientInvalid] = React.useState(false);
  const {
    filters,
    setFilters,
    ehrByNationalNumber_m,
    callMutation,
    selectedRecord,
    setSelectedRecord,
    isDetailModalOpen,
    setIsDetailModalOpen,
    mobileLaboratoryByNationalNumber_m,
    mobileXRayByNationalNumber_m,
    mobileNumberByNationalNumber_m,
  } = useElectronicHealthRecord();

  // Action handlers
  const handleViewDetails = (record: ElectronicHealthRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  // Opens the patient page directly, skipping the table and its date filters
  // entirely. The id folds Persian digits and a lost leading zero the same
  // way every other patient link on the console does.
  const handleOpenPatient = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = fullNationalId(openPatientId);
    if (isNationalId(id)) {
      router.push(PATIENT_PATH(id));
      return;
    }
    setOpenPatientInvalid(true);
  };

  // Column definitions with locale-aware formatting
  const columns = useEHRColumns({
    locale,
    onViewDetails: handleViewDetails,
  });

  // Table instance
  const table = useTable({
    features: appTableFeatures,
    data: ehrByNationalNumber_m.data || [],
    columns: columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      sorting: [
        {
          id: "تاريخ",
          desc: false, // Sort by date in descending order (most recent first)
        },
      ],
    },
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      <PageHeader
        breadcrumbs={<ConsoleBreadcrumbs />}
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <EHRFilter isLoading={ehrByNationalNumber_m.isPending} />
            <Button
              onClick={callMutation}
              variant="outline"
              size="sm"
              disabled={ehrByNationalNumber_m.isPending}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  ehrByNationalNumber_m.isPending ? "animate-spin" : ""
                }`}
              />
              <span>{t("refresh")}</span>
            </Button>
          </>
        }
      />

      <form
        onSubmit={handleOpenPatient}
        className="flex flex-col gap-1"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Input
            inputMode="numeric"
            dir="ltr"
            aria-label={t("openPatientLabel")}
            placeholder={t("openPatientPlaceholder")}
            value={openPatientId}
            onChange={(e) => {
              setOpenPatientId(e.target.value);
              setOpenPatientInvalid(false);
            }}
            className="max-w-48"
          />
          <Button type="submit" variant="outline" size="sm">
            {t("openPatientAction")}
          </Button>
        </div>
        {openPatientInvalid && (
          <span aria-live="polite" className="text-sm text-destructive">
            {t("openPatientInvalid")}
          </span>
        )}
      </form>

      {(filters.nationalNumber ||
        filters.dateRange?.from ||
        filters.dateRange?.to ||
        filters.patientType) && (
        // flex-wrap per ux-guidelines #115: a chip collection must reflow,
        // not clip, when space or text size changes.
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{t("activeFilters")}</span>
          {filters.nationalNumber && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFilters({ ...filters, nationalNumber: "" })}
              aria-label={t("removeNationalNumber")}
            >
              <XIcon aria-hidden="true" className="size-4" />
              <span>{t("nationalNumberFilter")}: {fmt(filters.nationalNumber)}</span>
            </Button>
          )}
          {filters.dateRange?.from && filters.dateRange.to && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setFilters({
                  ...filters,
                  dateRange: { from: undefined, to: undefined },
                })
              }
              aria-label={t("removeDateRange")}
            >
              <XIcon aria-hidden="true" className="size-4" />
              <span>{t("dateRangeFilter")}:</span>
              <span>
                {fmt(
                  `${formatDate(
                    filters.dateRange?.from,
                    locale
                  )} - ${formatDate(filters.dateRange?.to, locale)}`
                )}
              </span>
            </Button>
          )}
          {filters.patientType && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setFilters({ ...filters, patientType: "" })}
              aria-label={t("removePatientType")}
            >
              <XIcon aria-hidden="true" className="size-4" />
              <span>{t("patientTypeFilter")}: {tPatientTypes(filters.patientType)}</span>
            </Button>
          )}
        </div>
      )}

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

      {/* Detail Modal */}
      <EHRDetailModal
        record={selectedRecord}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
        actions={{
          mobileLaboratoryByNationalNumber_m,
          mobileXRayByNationalNumber_m,
          mobileNumberByNationalNumber_m,
        }}
      />
    </div>
  );
};

export default Client;
