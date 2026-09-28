"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useList_PatientRecord_API } from "@/data/patient-entry/api/records";
import { useList_PersonReports_API } from "@/data/saderat-bank-health-monitoring/api/person-reports";
import { CAMPAIGN_PATIENT_PATH } from "@/lib/national-id";

type CampaignRow = {
  id: number;
  name_en: string;
  name_fa: string;
  /** Sum of `match_count` across this campaign's uploads for this person. */
  uploads: number;
  /** This person's form records for this campaign. */
  records: number;
};

/**
 * Every campaign this patient shows up in, whether by an Excel row or a form
 * record, each opening the patient-in-campaign page. Any console user can
 * read both sources, so this card carries no staff gate.
 */
export const PatientCampaignsCard = ({ nationalId }: { nationalId: string }) => {
  const t = useTranslations("/console/patients.PatientPage");
  const locale = useLocale();
  const reports = useList_PersonReports_API({ nationalId });
  const records = useList_PatientRecord_API({ nationalId, authorized: true });

  const isPending = reports.isPending || records.isPending;
  const isError = reports.isError || records.isError;

  const campaigns = () => {
    const byId = new Map<number, CampaignRow>();
    const rowFor = (monitoring: { id: number; name_en: string; name_fa: string }) => {
      const existing = byId.get(monitoring.id);
      if (existing) return existing;
      const created: CampaignRow = {
        id: monitoring.id,
        name_en: monitoring.name_en,
        name_fa: monitoring.name_fa,
        uploads: 0,
        records: 0,
      };
      byId.set(monitoring.id, created);
      return created;
    };
    for (const report of reports.data ?? []) {
      rowFor(report.monitoring).uploads += report.match_count;
    }
    for (const record of records.data ?? []) {
      rowFor(record.monitoring).records += 1;
    }
    return [...byId.values()];
  };

  const body = () => {
    if (isPending) return <Skeleton className="h-16 w-full" />;
    if (isError) {
      return (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0 text-destructive" />
          <span>{t("campaignsError")}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (reports.isError) void reports.refetch();
              if (records.isError) void records.refetch();
            }}
          >
            {t("retry")}
          </Button>
        </div>
      );
    }
    const rows = campaigns();
    if (rows.length === 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Inbox aria-hidden="true" className="size-4 shrink-0" />
          <span>{t("campaignsEmpty")}</span>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-border rounded-lg border border-border">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{locale === "fa" ? row.name_fa : row.name_en}</p>
              <p className="text-sm text-muted-foreground">
                {t("campaignSummary", { uploads: row.uploads, records: row.records })}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={CAMPAIGN_PATIENT_PATH(row.id, nationalId)}>
                {t("open")}
                <ChevronRight aria-hidden="true" className="size-4 rtl:rotate-180" />
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("campaignsTitle")}</CardTitle>
        <CardDescription>{t("campaignsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>{body()}</CardContent>
    </Card>
  );
};
