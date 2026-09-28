"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format as formatIso, isValid, parseISO, subYears } from "date-fns";
import { format as formatJalali } from "date-fns-jalali";
import { AlertCircle, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";
import { DateRangePicker } from "@/components/app/date-range-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY,
  mobile_number_by_national_number,
} from "@/data/electronic health record/api/mobile-number-by-national-number";
import { fullNationalId, isNationalId, safeDecode } from "@/lib/national-id";
import { localeDigits } from "@/lib/utils";
import { usePersonEhr, type LabSeries } from "../../saderat-bank-health-monitoring/_ehr/use-person-ehr";
import { EhrRecordsTable } from "../../saderat-bank-health-monitoring/_ehr/records-table";
import { EhrTrendDialog } from "../../saderat-bank-health-monitoring/_ehr/trend-dialog";
import { useRecordDetail } from "../../saderat-bank-health-monitoring/_ehr/use-record-detail";
import { EHR_HISTORY_YEARS } from "../../saderat-bank-health-monitoring/_ehr/config";
import { PatientCampaignsCard } from "./_patient-campaigns";

const FIND_PATIENT = "/console/electronic-health-record";
/** The URL carries the window as plain Gregorian days; the picker shows Jalali. */
const URL_DAY = "yyyy-MM-dd";

const dayFromUrl = (value: string | null) => {
  if (!value) return undefined;
  const day = parseISO(value);
  return isValid(day) ? day : undefined;
};

/**
 * One patient's full history: EHR results for the chosen window, then every
 * monitoring record and every Excel report that mentions them. Each section
 * loads and fails on its own, so one slow or broken source never blanks the
 * page.
 */
export default function PatientPage(
  props: PageProps<"/[locale]/console/patients/[national_id]">
) {
  const { national_id } = React.use(props.params);
  const nationalId = fullNationalId(safeDecode(national_id));
  const valid = isNationalId(nationalId);

  const t = useTranslations("/console/patients.PatientPage");
  const tNav = useTranslations("/console.ConsoleSidebar");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Keyed on the URL strings, so the EHR queries are not re-keyed every render.
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const range = React.useMemo(() => {
    const to = dayFromUrl(toParam) ?? new Date();
    return { from: dayFromUrl(fromParam) ?? subYears(to, EHR_HISTORY_YEARS), to };
  }, [fromParam, toParam]);

  const setRange = (range: { from?: Date; to?: Date } | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (range?.from) params.set("from", formatIso(range.from, URL_DAY));
    else params.delete("from");
    if (range?.to) params.set("to", formatIso(range.to, URL_DAY));
    else params.delete("to");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const ehr = usePersonEhr({ nationalId, window: range, enabled: valid });
  const [selectedSeries, setSelectedSeries] = React.useState<LabSeries | null>(null);
  const recordDetail = useRecordDetail();

  const person = useQuery({
    queryKey: [PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY, nationalId],
    queryFn: () => mobile_number_by_national_number({ params: { nationalNumber: nationalId } }),
    enabled: valid,
    staleTime: 5 * 60 * 1000,
  });
  const found = person.data?.[0];
  const name = found ? `${found.FirstName ?? ""} ${found.LastName ?? ""}`.trim() : "";

  const breadcrumbs = (
    <ConsoleBreadcrumbs parent={{ href: FIND_PATIENT, label: tNav("findPatient") }} />
  );

  if (!valid) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumbs={breadcrumbs} title={t("invalidTitle")} />
        <Alert>
          <AlertCircle aria-hidden="true" className="size-4" />
          <AlertTitle>{t("invalidTitle")}</AlertTitle>
          <AlertDescription>
            <Link href={FIND_PATIENT} className="underline underline-offset-4">
              {t("invalidDescription")}
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const serviceReportHref = `/console/patient-reports?${new URLSearchParams({
    nationalNumber: nationalId,
    fromDate: formatJalali(range.from, "yyyy/MM/dd"),
    toDate: formatJalali(range.to, "yyyy/MM/dd"),
    patientType: "25",
  }).toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={name || t("fallbackTitle")}
        description={t("nationalId", { id: localeDigits(nationalId, locale) })}
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />
      <p className="max-w-[65ch] text-sm text-muted-foreground">{t("rangeHint")}</p>

      <Card>
        <CardHeader>
          <CardTitle>{t("ehrTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <EhrRecordsTable
            ehr={ehr}
            onViewRecord={recordDetail.open}
            onSelectSeries={setSelectedSeries}
          />
        </CardContent>
      </Card>

      <PatientCampaignsCard nationalId={nationalId} />

      <Card>
        <CardHeader>
          <CardTitle>{t("serviceReportTitle")}</CardTitle>
          <CardDescription>{t("serviceReportDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={serviceReportHref}>
              {t("serviceReportAction")}
              <ChevronRight aria-hidden="true" className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {recordDetail.modal}
      <EhrTrendDialog
        series={selectedSeries}
        onOpenChange={(open) => {
          if (!open) setSelectedSeries(null);
        }}
      />
    </div>
  );
}
