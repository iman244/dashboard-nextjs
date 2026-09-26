"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { DarkModeToggle } from "@/components/app/theme-toggle";
import { PatientRecordsContent } from "@/components/app/patient-records-section";
import { localeDigits } from "@/lib/utils";
import { fetchPatientRecords } from "@/lib/patient-session";
import { DJANGO_ADDRESS, DJANGO_API_PATH } from "@/settings";
import type { PatientRecord } from "@/data/patient-entry/types";
import { usePatientSession } from "../../provider";

export default function Client() {
  const t = useTranslations("/patient/records.PatientRecords");
  const locale = useLocale();
  const { nationalId, sessionId, signOut } = usePatientSession();
  const records = useQuery<PatientRecord[]>({
    queryKey: ["patient-own-records", sessionId],
    queryFn: ({ signal }) => fetchPatientRecords(DJANGO_ADDRESS + DJANGO_API_PATH, signal),
    enabled: Boolean(sessionId),
    retry: false,
    gcTime: 0,
  });
  return (
    <main className="container mx-auto flex min-h-dvh flex-col gap-6 p-4">
      <PageHeader title={t("title")} description={t("subtitle", { nationalId: localeDigits(nationalId ?? "", locale) })}
        actions={<><DarkModeToggle /><Button variant="ghost" size="sm" onClick={signOut}><LogOut className="me-2 size-4" />{t("signOut")}</Button></>} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-prose text-sm text-muted-foreground">{t("availability")}</p>
        <Button variant="outline" size="sm" disabled={records.isFetching} onClick={() => void records.refetch()}>
          <RefreshCw className="size-4" />{t("refresh")}
        </Button>
      </div>
      <PatientRecordsContent key={sessionId} records={records} />
    </main>
  );
}
