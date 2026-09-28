"use client";

import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Inbox, Pencil, Trash } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/page-header";
import { ConsoleBreadcrumbs } from "@/components/app/console-breadcrumbs";
import { LoadingState } from "@/components/app/loading-state";
import { RowAction, RowActions } from "@/components/app";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api";
import { MonitoringType } from "@/data/monitoring-type/types";
import { useIsStaff } from "@/data/user/fetches/me";
import { localeDigits } from "@/lib/utils";
import React from "react";
import DeleteMonitoringTypeDialog from "./_delete-dialog/dialog";

/**
 * Every campaign, with its upload and record counts.
 *
 * Administrative: the backend's `IsConsoleReader` lets any signed-in console
 * user read this list, and only staff change it, so the write controls are
 * gated on `useIsStaff()` -- the same rule, enforced in both places.
 */
const MonitoringTypesPage = () => {
  const { data, isPending, error } = useList_MonitoringType_API();
  const isStaff = useIsStaff();
  const locale = useLocale();

  const t = useTranslations("/console/monitorings.MonitoringTypesPage");
  const tNav = useTranslations("/console.ConsoleSidebar");
  const tDictionary = useTranslations("common.Dictionary");
  const tLoading = useTranslations("common.Loading");

  const [deleteRow, setDeleteRow] = React.useState<MonitoringType | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumbs={<ConsoleBreadcrumbs />}
        title={t("PageTitle")}
        description={t("PageDescription")}
        actions={
          isStaff ? (
            <>
              <Button variant="outline" asChild>
                <Link href="/console/monitorings/upload">
                  {tNav("uploadExcel")}
                </Link>
              </Button>
              <Button asChild>
                <Link href="/console/monitorings/new">{t("CreateType")}</Link>
              </Button>
            </>
          ) : undefined
        }
      />

      {isStaff && (
        <DeleteMonitoringTypeDialog
          data={deleteRow ?? undefined}
          open={!!deleteRow}
          onOpenChange={(open) => setDeleteRow(open ? deleteRow : null)}
        />
      )}

      {isPending ? (
        <LoadingState label={tLoading("monitoringTypes")} />
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" className="size-4" />
          <AlertTitle>{t("ErrorTitle")}</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : !data || data.length === 0 ? (
        <Alert>
          <Inbox aria-hidden="true" className="size-4" />
          <AlertTitle>{t("EmptyStateTitle")}</AlertTitle>
          <AlertDescription>
            {isStaff ? t("EmptyStateDescription") : t("EmptyStateDescriptionDetail")}
          </AlertDescription>
        </Alert>
      ) : (
        <ul className="max-w-3xl divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {data.map((monitoring) => {
            const name = locale === "fa" ? monitoring.name_fa : monitoring.name_en;
            return (
              <li
                key={monitoring.id}
                className="flex min-h-16 items-center gap-4 px-4 py-4"
              >
                <Link
                  href={`/console/monitorings/${monitoring.id}`}
                  className="group flex min-w-0 flex-1 flex-col gap-0.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="truncate font-medium group-hover:underline">
                    {name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("counts", {
                      uploads: localeDigits(monitoring.upload_count, locale),
                      records: localeDigits(monitoring.record_count, locale),
                    })}
                  </span>
                </Link>
                {isStaff && (
                  <RowActions>
                    <RowAction
                      icon={Pencil}
                      label={tDictionary("Edit")}
                      href={`/console/monitorings/${monitoring.id}/edit`}
                    />
                    <RowAction
                      icon={Trash}
                      label={tDictionary("Delete")}
                      onClick={() => setDeleteRow(monitoring)}
                    />
                  </RowActions>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MonitoringTypesPage;
