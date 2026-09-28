"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Inbox, User } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";
import { LoadingState } from "@/components/app/loading-state";
import { PatientRecordsContent } from "@/components/app/patient-records-section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api/list";
import { useList_PatientRecord_API } from "@/data/patient-entry/api/records";
import { useList_PersonReports_API } from "@/data/saderat-bank-health-monitoring/api/person-reports";
import type { SBHM_Step2Record } from "@/data/saderat-bank-health-monitoring/types";
import { useIsStaff } from "@/data/user/fetches/me";
import { PATIENT_PATH, fullNationalId, isNationalId } from "@/lib/national-id";
import { formatDate, localeDigits } from "@/lib/utils";
import { Step1PersonSections } from "../../../_reports/step-1-person";
import { Step2PersonSections } from "../../../_reports/step-2-person";
import { FieldList } from "../../../_reports/field-list";

type Row = Record<string, unknown>;

/** One row, drawn the way its campaign lays a person out. */
const PersonRow = ({ slug, row }: { slug: string; row: Row }) =>
  slug === "step_1" ? (
    <Step1PersonSections row={row as React.ComponentProps<typeof Step1PersonSections>["row"]} />
  ) : slug === "step_2" ? (
    <Step2PersonSections row={row as SBHM_Step2Record} />
  ) : (
    <FieldList row={row} />
  );

/**
 * One patient inside one campaign: their rows from each of its uploads,
 * newest first (Django orders them), then their form record for it.
 *
 * Readable by every console user; only editing the record is staff-only, as
 * Django enforces. The EHR lives on the patient page, which the header links to.
 */
export default function CampaignPatientPage(
  props: PageProps<"/[locale]/console/monitorings/[id]/patients/[national_id]">
) {
  const { id, national_id } = React.use(props.params);
  const campaignId = Number(id);
  const nationalId = fullNationalId(decodeURIComponent(national_id));
  const valid = isNationalId(nationalId);

  const t = useTranslations("/console/monitorings.CampaignPatient");
  const tCampaign = useTranslations("/console/monitorings.Campaign");
  const tPatient = useTranslations("/console/patients.PatientPage");
  const tNav = useTranslations("/console.ConsoleSidebar");
  const tLoading = useTranslations("common.Loading");
  const locale = useLocale();
  const isStaff = useIsStaff();

  const types = useList_MonitoringType_API();
  const campaign = types.data?.find((candidate) => candidate.id === campaignId);
  const reports = useList_PersonReports_API({
    nationalId,
    monitoring: campaign?.id,
    enabled: Boolean(campaign),
  });
  const records = useList_PatientRecord_API({ nationalId, authorized: true });
  const campaignRecords = (records.data ?? []).filter(
    (record) => record.monitoring.id === campaign?.id
  );

  const campaignName = campaign ? (locale === "fa" ? campaign.name_fa : campaign.name_en) : "";
  const breadcrumbs = (
    <ConsoleBreadcrumbs
      trail={[
        { href: "/console/monitorings", label: tNav("campaigns") },
        ...(campaign ? [{ href: `/console/monitorings/${campaign.id}`, label: campaignName }] : []),
      ]}
    />
  );

  if (!valid) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumbs={breadcrumbs} title={tPatient("invalidTitle")} />
        <Alert>
          <AlertCircle aria-hidden="true" className="size-4" />
          <AlertTitle>{tPatient("invalidTitle")}</AlertTitle>
          <AlertDescription>
            <Link href="/console/electronic-health-record" className="underline underline-offset-4">
              {tPatient("invalidDescription")}
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (types.isPending) {
    return <LoadingState label={tLoading("monitoringTypes")} />;
  }

  if (types.isSuccess && !campaign) {
    return (
      <div className="space-y-4">
        <PageHeader breadcrumbs={breadcrumbs} title={tCampaign("notFound")} />
        <Alert>
          <AlertCircle aria-hidden="true" className="size-4" />
          <AlertTitle>{tCampaign("notFound")}</AlertTitle>
          <AlertDescription>
            <Link href="/console/monitorings" className="underline underline-offset-4">
              {tCampaign("backToList")}
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const firstRow = reports.data?.[0]?.rows?.[0];
  const name = firstRow
    ? `${firstRow["نام"] ?? ""} ${firstRow["نام خانوادگی"] ?? ""}`.trim()
    : "";

  const header = (
    <PageHeader
      breadcrumbs={breadcrumbs}
      title={name || t("fallbackTitle")}
      description={t("nationalId", { id: localeDigits(nationalId, locale) })}
      actions={
        <Button asChild variant="outline">
          <Link href={PATIENT_PATH(nationalId)}>
            <User aria-hidden="true" className="size-4" />
            {t("healthRecord")}
          </Link>
        </Button>
      }
    />
  );

  const body = () => {
    // A failed campaign list lands here too: without it nothing can load.
    if (types.isError || reports.isError || records.isError) {
      return (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0 text-destructive" />
          <span>{t("loadError")}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (types.isError) void types.refetch();
              if (reports.isError) void reports.refetch();
              if (records.isError) void records.refetch();
            }}
          >
            {tPatient("retry")}
          </Button>
        </div>
      );
    }

    if (!campaign || reports.isPending || records.isPending) {
      return <LoadingState label={tLoading("records")} />;
    }

    if (reports.data.length === 0 && campaignRecords.length === 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Inbox aria-hidden="true" className="size-4 shrink-0" />
          <span>{t("nothing")}</span>
        </div>
      );
    }

    return (
      <>
        {reports.data.map((report) => {
          const rows = report.rows ?? [];
          return (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>
                  {`${localeDigits(report.name, locale)} · ${localeDigits(
                    formatDate(new Date(report.created_at), locale),
                    locale
                  )}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {rows.map((row, index) => (
                  <div key={index} className="space-y-6">
                    {rows.length > 1 ? (
                      <Badge variant="secondary">
                        {t("rowIndex", { index: localeDigits(index + 1, locale) })}
                      </Badge>
                    ) : null}
                    <PersonRow slug={campaign.slug} row={row} />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {campaignRecords.length > 0 ? (
          <PatientRecordsContent
            records={{ ...records, data: campaignRecords }}
            editable={isStaff}
          />
        ) : null}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {header}
      {body()}
    </div>
  );
}
