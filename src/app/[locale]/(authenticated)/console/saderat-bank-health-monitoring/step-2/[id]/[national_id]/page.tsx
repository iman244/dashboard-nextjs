"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowRight, Inbox } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatCellValue, localeDigits } from "@/lib/utils";
import { useRetrieve_SBHM_API } from "@/data/saderat-bank-health-monitoring/api/retrieve";
import {
  SBHM_DETAIL_PATH,
  type SBHM_Step2Record,
} from "@/data/saderat-bank-health-monitoring/types";
import {
  BadgeItem,
  SectionCard,
  StatCard,
  TextCard,
  isBlank,
} from "../../../_detail/blocks";
import {
  DENSITY_GRID,
  STEP2_SECTIONS,
  STEP2_VITALS,
  fieldOf,
  iconOf,
} from "../_detail/sections";
import { noteKeyFor } from "../_detail/notes";
import { usePersonEhr, type LabSeries } from "../../../_ehr/use-person-ehr";
import { EhrTrendDialog } from "../../../_ehr/trend-dialog";
import { EhrRecordsTable } from "../../../_ehr/records-table";
import { PatientReportLink } from "../../../_ehr/patient-report-link";
import { useRecordDetail } from "../../../_ehr/use-record-detail";

/** One step_2 record, laid out the way the step-1 person page lays out its own. */
const RecordSections = ({ record }: { record: SBHM_Step2Record }) => {
  const t = useTranslations("/console/saderat-bank-health-monitoring.Detail");
  const locale = useLocale();

  const vitals = STEP2_VITALS.filter((v) => !isBlank(record[v.field]));

  return (
    <>
      {vitals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vitals.map((vital) => (
            <StatCard
              key={vital.field}
              icon={vital.icon}
              label={vital.field}
              unit={vital.unit}
              value={formatCellValue(record[vital.field] as string, locale)}
              group={
                vital.groupField
                  ? (record[vital.groupField] as string | null)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {STEP2_SECTIONS.map((section) => {
        // a note belongs under the field it annotates, never as a row of its own
        const notes = new Set(
          section.fields
            .map((f) => noteKeyFor(fieldOf(f)))
            .filter((n): n is NonNullable<typeof n> => Boolean(n))
        );
        const entries = section.fields.filter((f) => {
          const field = fieldOf(f);
          return !notes.has(field) && !isBlank(record[field]);
        });
        if (entries.length === 0) return null;

        const grid = DENSITY_GRID[section.density];

        if (section.kind === "texts") {
          return (
            <div key={section.titleKey} className={grid}>
              {entries.map((entry) => {
                const field = fieldOf(entry);
                return (
                  <TextCard
                    key={field}
                    icon={section.icon}
                    title={field}
                    value={record[field]}
                  />
                );
              })}
            </div>
          );
        }

        return (
          <SectionCard
            key={section.titleKey}
            icon={section.icon}
            title={t(section.titleKey)}
          >
            <div className={grid}>
              {entries.map((entry) => {
                const field = fieldOf(entry);
                const noteKey = noteKeyFor(field);
                return (
                  <BadgeItem
                    key={field}
                    label={field}
                    icon={iconOf(entry)}
                    value={record[field] as string | number | null}
                    note={noteKey ? record[noteKey] : undefined}
                  />
                );
              })}
            </div>
          </SectionCard>
        );
      })}
    </>
  );
};

const Step2PersonPage = (
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/step-2/[id]/[national_id]">
) => {
  const { id, national_id } = React.use(props.params);
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.SaderatBankHealthMonitoringPage"
  );
  const tDetail = useTranslations(
    "/console/saderat-bank-health-monitoring.Detail"
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
    null
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

  // The retrieve endpoint is shared between steps, so a step_1 id resolves here
  // happily and would render nothing recognisable. Point it at the right view.
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

  const person = matches[0];

  return (
    <div className="space-y-6 p-6">
      {/* Patient Header — the card step-1 opens with */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">
                {`${person["نام"] ?? ""} ${person["نام خانوادگی"] ?? ""}`.trim()}
              </CardTitle>
              <CardDescription className="mt-2">
                <div className="flex flex-wrap gap-4 text-sm">
                  <span>
                    <strong>کد ملی:</strong>{" "}
                    {formatCellValue(national_id, locale)}
                  </span>
                  <span>
                    <strong>سن:</strong>{" "}
                    {!isBlank(person["سن"])
                      ? formatCellValue(person["سن"] as string, locale)
                      : "-"}
                  </span>
                  <span>
                    <strong>جنسیت:</strong>{" "}
                    {!isBlank(person["جنسیت"])
                      ? formatCellValue(person["جنسیت"] as string, locale)
                      : "-"}
                  </span>
                  <span>
                    <strong>پایش:</strong> {localeDigits(data.name, locale)}
                  </span>
                </div>
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={SBHM_DETAIL_PATH("step_2", data.id)}>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                {tDetail("backToReport")}
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

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
          <CardTitle>{tEhr("recordsTitle")}</CardTitle>
          <PatientReportLink ehr={ehr} nationalId={national_id} />
        </CardHeader>
        <CardContent>
          <EhrRecordsTable
            ehr={ehr}
            onViewRecord={recordDetail.open}
            onSelectSeries={setSelectedSeries}
          />
        </CardContent>
      </Card>

      {matches.map((record, i) => (
        <div key={i} className="space-y-6">
          {matches.length > 1 && (
            <Badge variant="secondary">
              {tDetail("recordIndex", { index: localeDigits(i + 1, locale) })}
            </Badge>
          )}
          <RecordSections record={record} />
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
