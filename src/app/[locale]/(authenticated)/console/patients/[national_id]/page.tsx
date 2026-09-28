"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format as formatIso, isValid, parseISO, subYears } from "date-fns";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";
import { DateRangePicker } from "@/components/app/date-range-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY,
  mobile_number_by_national_number,
} from "@/data/electronic health record/api/mobile-number-by-national-number";
import { fullNationalId, isNationalId, safeDecode } from "@/lib/national-id";
import { localeDigits } from "@/lib/utils";
import { useDirection } from "@/lib/use-direction";
import { type PatientType } from "@/components/app/patient-type-selector";
import { type LabSeries } from "../../saderat-bank-health-monitoring/_ehr/use-person-ehr";
import { EhrRecordsTable } from "../../saderat-bank-health-monitoring/_ehr/records-table";
import { EhrTrendDialog } from "../../saderat-bank-health-monitoring/_ehr/trend-dialog";
import { useRecordDetail } from "../../saderat-bank-health-monitoring/_ehr/use-record-detail";
import { EHR_HISTORY_YEARS } from "../../saderat-bank-health-monitoring/_ehr/config";
import { PatientCampaignsCard } from "./_patient-campaigns";
import { usePatientEhrTabs } from "./use-patient-ehr-tabs";

const FIND_PATIENT = "/console/electronic-health-record";
/** The URL carries the window as plain Gregorian days; the picker shows Jalali. */
const URL_DAY = "yyyy-MM-dd";

const dayFromUrl = (value: string | null) => {
  if (!value) return undefined;
  const day = parseISO(value);
  return isValid(day) ? day : undefined;
};

/**
 * One patient's full history: EHR results for the chosen window, one tab per
 * record type, then every campaign that mentions them. Each section loads
 * and fails on its own, so one slow or broken source never blanks the page.
 */
export default function PatientPage(
  props: PageProps<"/[locale]/console/patients/[national_id]">
) {
  const { national_id } = React.use(props.params);
  const nationalId = fullNationalId(safeDecode(national_id));
  const valid = isNationalId(nationalId);

  const t = useTranslations("/console/patients.PatientPage");
  const tNav = useTranslations("/console.ConsoleSidebar");
  const tPatientTypes = useTranslations("common.PatientTypes");
  const locale = useLocale();
  const dir = useDirection();
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

  const { settled, tabs, failed } = usePatientEhrTabs({ nationalId, range, enabled: valid });
  const [selectedSeries, setSelectedSeries] = React.useState<LabSeries | null>(null);
  // The tab the reader last picked; `ehrBody` falls it back to the first tab
  // at render time when it no longer names one of `tabs`.
  const [selectedTab, setSelectedTab] = React.useState<PatientType | undefined>(undefined);
  const recordDetail = useRecordDetail();

  const person = useQuery({
    queryKey: [PDD_MOBILE_NUMBER_BY_NATIONAL_NUMBER_KEY, nationalId],
    queryFn: () => mobile_number_by_national_number({ params: { nationalNumber: nationalId } }),
    enabled: valid,
    staleTime: 5 * 60 * 1000,
    // An EHR-host request: an unreachable EHR only loses the name, never the page.
    meta: { silentNetworkError: true },
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

  const ehrBody = () => {
    if (!settled) {
      return (
        <div role="status" aria-label={t("tabsLoading")} className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      );
    }
    if (tabs.length === 0 && failed.length === 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Inbox aria-hidden="true" className="size-4 shrink-0" />
          <span>{t("ehrEmpty")}</span>
        </div>
      );
    }
    // Falls back to the first tab whenever `selectedTab` names a type no
    // longer among `tabs` (a range change or a successful retry can drop or
    // add types), computed here rather than synced in an effect, so a retry
    // that succeeds never yanks the reader back to the first tab.
    const activeTab = tabs.find((tab) => tab.type === selectedTab)?.type ?? tabs[0]?.type;
    return (
      <div className="space-y-4">
        {tabs.length > 0 && activeTab !== undefined && (
          <Tabs
            dir={dir}
            value={String(activeTab)}
            onValueChange={(value) => setSelectedTab(value as PatientType)}
          >
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.type} value={String(tab.type)}>
                  {tPatientTypes(tab.type)}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.type} value={String(tab.type)}>
                <EhrRecordsTable
                  ehr={tab.ehr}
                  onViewRecord={recordDetail.open}
                  onSelectSeries={setSelectedSeries}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
        {failed.map(({ type, retry, isFetching }) => (
          <Alert key={type} variant="destructive">
            <AlertCircle aria-hidden="true" className="size-4" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{t("ehrFailed", { type: tPatientTypes(type) })}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retry}
                disabled={isFetching}
                aria-busy={isFetching}
              >
                {isFetching && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                {t("retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

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
        <CardContent>{ehrBody()}</CardContent>
      </Card>

      <PatientCampaignsCard nationalId={nationalId} />

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
