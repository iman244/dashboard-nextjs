"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { formatDate, localeDigits } from "@/lib/utils";
import { useList_PersonReports_API } from "@/data/saderat-bank-health-monitoring/api/person-reports";
import {
  SBHM_DETAIL_PATH,
  SBHM_TYPE_LABEL_KEY,
  isKnownSBHM_Type,
} from "@/data/saderat-bank-health-monitoring/types";

/**
 * Every uploaded Excel report with rows for this person, each linking to the
 * person page inside that upload. Staff only, like the endpoint behind it.
 */
export const ExcelReportsCard = ({ nationalId }: { nationalId: string }) => {
  const t = useTranslations("/console/patients.PatientPage");
  const tStep = useTranslations("common.SBHM_Step");
  const locale = useLocale();
  const { data, isPending, isError, refetch } = useList_PersonReports_API({ nationalId });

  const body = () => {
    if (isPending) return <Skeleton className="h-16 w-full" />;
    if (isError) {
      return (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0 text-destructive" />
          <span>{t("excelError")}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            {t("retry")}
          </Button>
        </div>
      );
    }
    if (data.length === 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Inbox aria-hidden="true" className="size-4 shrink-0" />
          <span>{t("excelEmpty")}</span>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-border rounded-lg border border-border">
        {data.map((report) => {
          const known = isKnownSBHM_Type(report.type);
          return (
            <li key={report.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{localeDigits(report.name, locale)}</p>
                <p className="text-sm text-muted-foreground">
                  {known ? tStep(SBHM_TYPE_LABEL_KEY(report.type)) : report.type}
                  {" · "}
                  {localeDigits(formatDate(new Date(report.created_at), locale), locale)}
                  {" · "}
                  {t("rowCount", { count: localeDigits(report.match_count, locale) })}
                </p>
              </div>
              {known ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`${SBHM_DETAIL_PATH(report.type, report.id)}/${nationalId}`}>
                    {t("open")}
                    <ChevronRight aria-hidden="true" className="size-4 rtl:rotate-180" />
                  </Link>
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">{t("noReportView")}</span>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("excelTitle")}</CardTitle>
        <CardDescription>{t("excelDescription")}</CardDescription>
      </CardHeader>
      <CardContent>{body()}</CardContent>
    </Card>
  );
};
