"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowRight, Inbox, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";
import { LoadingState } from "@/components/app/loading-state";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { asFieldSchema } from "@/components/schema-form";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api/list";
import { useMe_API } from "@/data/user/fetches/me";

export default function RecordMonitoringPage() {
  const t = useTranslations("/console/record-monitoring");
  const locale = useLocale();
  const { data: user, isPending: userPending } = useMe_API();
  const isStaff = user?.is_staff === true;
  const { data, isPending, error, refetch } = useList_MonitoringType_API({ enabled: isStaff });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={<ConsoleBreadcrumbs />}
        title={t("title")}
        description={t("description")}
        actions={isStaff ? (
          <Button variant="outline" asChild>
            <Link href="/console/monitorings/new"><Plus aria-hidden="true" className="size-4" />{t("createType")}</Link>
          </Button>
        ) : undefined}
      />
      {userPending ? <LoadingState label={t("loading")} /> : !isStaff ? (
        <Alert>
          <AlertCircle aria-hidden="true" className="size-4" />
          <AlertTitle>{t("accessDeniedTitle")}</AlertTitle>
          <AlertDescription>{t("accessDeniedDescription")}</AlertDescription>
        </Alert>
      ) : isPending ? <LoadingState label={t("loading")} /> : error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" className="size-4" />
          <AlertTitle>{t("errorTitle")}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>{t("errorDescription")}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>{t("retry")}</Button>
          </AlertDescription>
        </Alert>
      ) : !data?.length ? (
        <Alert>
          <Inbox aria-hidden="true" className="size-4" />
          <AlertTitle>{t("emptyTitle")}</AlertTitle>
          <AlertDescription>{isStaff ? t("emptyStaff") : t("emptyViewer")}</AlertDescription>
        </Alert>
      ) : (
        <ul className="max-w-3xl divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {data.map((monitoring) => {
            const hasFields = asFieldSchema(monitoring.field_schema).fields.length > 0;
            const name = locale === "fa" ? monitoring.name_fa : monitoring.name_en;
            return (
              <li key={monitoring.id}>
                <Link
                  href={`/console/monitorings/${monitoring.id}/records`}
                  className="group flex min-h-16 items-center gap-4 px-4 py-4 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {hasFields ? t("ready") : t("noFields")}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-primary">{t("viewEntries")}</span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 rtl:rotate-180" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
