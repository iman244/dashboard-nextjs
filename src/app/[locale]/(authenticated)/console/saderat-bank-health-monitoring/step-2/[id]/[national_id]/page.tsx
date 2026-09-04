"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowRight, Inbox } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { localeDigits } from "@/lib/utils";
import { useRetrieve_SBHM_API } from "@/data/saderat-bank-health-monitoring/api/retrieve";
import {
  SBHM_DETAIL_PATH,
  type SBHM_Step2Record,
} from "@/data/saderat-bank-health-monitoring/types";
import { STEP2_FIELD_GROUPS, noteKeyFor } from "../_detail/field-groups";
import { usePersonEhr, type LabSeries } from "../../../_ehr/use-person-ehr";
import { EhrTrendDialog } from "../../../_ehr/trend-dialog";
import { EhrTimeline } from "../../../_ehr/timeline";
import { EhrTimelineTable } from "../../../_ehr/timeline-table";
import { PatientReportLink } from "../../../_ehr/patient-report-link";
import { useRecordDetail } from "../../../_ehr/use-record-detail";

const isEmpty = (v: unknown) => v === null || v === undefined || v === "";

/** One field and, when present, its paired `توضیحات` note. */
const FieldRow = ({
  label,
  value,
  note,
  locale,
}: {
  label: string;
  value: unknown;
  note?: unknown;
  locale: string;
}) => (
  <div className="flex flex-col gap-0.5 py-2 border-b last:border-b-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm">{localeDigits(String(value), locale)}</span>
    {!isEmpty(note) && (
      <span className="text-xs text-muted-foreground italic">
        {localeDigits(String(note), locale)}
      </span>
    )}
  </div>
);

const Step2PersonPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/step-2/[id]/[national_id]">,
) => {
  const { id, national_id } = React.use(props.params);
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.SaderatBankHealthMonitoringPage",
  );
  const tDetail = useTranslations(
    "/console/saderat-bank-health-monitoring.Step2Detail",
  );
  const tEhr = useTranslations("/console/saderat-bank-health-monitoring.Ehr");
  const locale = useLocale();

  const { data, isPending, error } = useRetrieve_SBHM_API({
    input: { pathVariables: { id: parseInt(id) } },
  });

  // National id is not unique: 5 of 537 are shared by two records. step-1 uses
  // .find() and silently shows the first; every match is rendered here instead.
  const matches = React.useMemo(() => {
    if (data?.type !== "step_2") return [];
    const records = data.json as unknown as SBHM_Step2Record[];
    return records.filter((r) => String(r["کد ملی"] ?? "") === national_id);
  }, [data, national_id]);

  // Fetched once for the person, not once per matched record: EHR is keyed by
  // national id, and 5 of 537 ids appear on two rows. Fetching inside the
  // matches loop would fire duplicate requests and print the same labs twice.
  const ehr = usePersonEhr({
    nationalId: national_id,
    campaignDate: data?.created_at ?? "",
    enabled: data?.type === "step_2",
  });

  const [selectedSeries, setSelectedSeries] = React.useState<LabSeries | null>(
    null,
  );
  const recordDetail = useRecordDetail();

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

  if (data.type !== "step_2") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("WrongStepTitle")}</p>
        <Button asChild variant="outline">
          <Link href={SBHM_DETAIL_PATH(data.type, data.id)}>
            {t("WrongStepAction")}
          </Link>
        </Button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{tDetail("notFound")}</p>
        <Button asChild variant="outline">
          <Link href={SBHM_DETAIL_PATH("step_2", data.id)}>
            {tDetail("backToReport")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {`${matches[0]["نام"] ?? ""} ${matches[0]["نام خانوادگی"] ?? ""}`.trim()}
          </h2>
          <p className="text-sm text-muted-foreground">
            {localeDigits(national_id, locale)} ·{" "}
            {localeDigits(data.name, locale)}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={SBHM_DETAIL_PATH("step_2", data.id)}>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            {tDetail("backToReport")}
          </Link>
        </Button>
      </div>

      {matches.length > 1 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/40">
          <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {tDetail("duplicateNationalId", {
              count: localeDigits(matches.length, locale),
            })}
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>{tEhr("timelineTitle")}</CardTitle>
          <PatientReportLink ehr={ehr} nationalId={national_id} />
        </CardHeader>
        <CardContent className="space-y-6">
          <EhrTimeline ehr={ehr} campaignDate={data.created_at} />
          <EhrTimelineTable
            ehr={ehr}
            onViewRecord={recordDetail.open}
            onSelectSeries={setSelectedSeries}
          />
        </CardContent>
      </Card>

      {matches.map((record, i) => (
        <div key={i} className="space-y-4">
          {matches.length > 1 && (
            <Badge variant="secondary">
              {tDetail("recordIndex", { index: localeDigits(i + 1, locale) })}
            </Badge>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {STEP2_FIELD_GROUPS.map((group) => {
              // only fields this person actually has
              const rows = group.fields.filter((f) => !isEmpty(record[f]));
              if (rows.length === 0) return null;
              return (
                <Card key={group.titleKey}>
                  <CardHeader>
                    <CardTitle>{tDetail(group.titleKey)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rows.map((field) => {
                      const noteKey = noteKeyFor(field);
                      return (
                        <FieldRow
                          key={field}
                          label={field}
                          value={record[field]}
                          note={noteKey ? record[noteKey] : undefined}
                          locale={locale}
                        />
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {recordDetail.modal}

      <EhrTrendDialog
        series={selectedSeries}
        onOpenChange={(open) => {
          if (!open) setSelectedSeries(null);
        }}
      />
    </div>
  );
};

export default Step2PersonPage;
