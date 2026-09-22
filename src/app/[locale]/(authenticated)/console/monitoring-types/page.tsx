"use client";

import { DataTable, RowAction, RowActions } from "@/components/app";
import { LoadingState } from "@/components/app/loading-state";
import { PageHeader } from "@/components/app/page-header";
import {
  appTableFeatures,
  type AppTableFeatures,
} from "@/components/app/table-features";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api";
import { MonitoringType } from "@/data/monitoring-type/types";
import { isKnownSBHM_Type } from "@/data/saderat-bank-health-monitoring/types";
import { useIsStaff } from "@/data/user/fetches/me";
import { createColumnHelper, useTable } from "@tanstack/react-table";
import { AlertCircle, Inbox, Pencil, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";
import DeleteMonitoringTypeDialog from "./_delete-dialog/dialog";
import MonitoringTypeFormDialog from "./_form-dialog/dialog";

const columnHelper = createColumnHelper<AppTableFeatures, MonitoringType>();

/**
 * Manage the monitoring types reports can be filed under.
 *
 * Administrative: the backend's IsStaffOrReadOnly lets any signed-in user read
 * this list, and only staff change it, so the write controls are gated on
 * `useIsStaff()` — the same rule, enforced in both places.
 */
const MonitoringTypesPage = () => {
  const { data, isPending, error } = useList_MonitoringType_API();
  const isStaff = useIsStaff();

  const t = useTranslations("/console/monitoring-types.MonitoringTypesPage");
  const tDictionary = useTranslations("common.Dictionary");
  const tLoading = useTranslations("common.Loading");

  // `undefined` = closed. A row = editing it. `null` = creating.
  const [formRow, setFormRow] = React.useState<
    MonitoringType | null | undefined
  >(undefined);
  const [deleteRow, setDeleteRow] = React.useState<MonitoringType | null>(null);

  const columns = React.useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("slug", {
          header: t("SlugColumn"),
          cell: (info) => {
            const slug = info.getValue();
            return (
              <div className="flex items-center gap-2">
                {/* dir="ltr" because a slug is ASCII and would otherwise be
                    reordered around the Persian text beside it in RTL. */}
                <code dir="ltr" className="font-mono text-sm">
                  {slug}
                </code>
                {/* Only the exceptional case is marked. Every type used to be
                    one this dashboard could render; now that staff can create
                    them, a type with no route here is possible and silently
                    produces reports with no detail page. */}
                {!isKnownSBHM_Type(slug) && (
                  <Badge variant="outline" className="font-normal">
                    {t("NoViewBadge")}
                  </Badge>
                )}
              </div>
            );
          },
        }),
        columnHelper.accessor("name_en", {
          header: t("NameEnColumn"),
          cell: (info) => <span dir="ltr">{info.getValue()}</span>,
        }),
        columnHelper.accessor("name_fa", {
          header: t("NameFaColumn"),
          cell: (info) => <span dir="rtl">{info.getValue()}</span>,
        }),
        ...(isStaff
          ? [
              columnHelper.display({
                id: "actions",
                header: tDictionary("Actions"),
                enableSorting: false,
                cell: ({ row }) => (
                  <RowActions>
                    <RowAction
                      icon={Pencil}
                      label={tDictionary("Edit")}
                      onClick={() => setFormRow(row.original)}
                    />
                    <RowAction
                      icon={Trash}
                      label={tDictionary("Delete")}
                      onClick={() => setDeleteRow(row.original)}
                    />
                  </RowActions>
                ),
              }),
            ]
          : []),
      ]),
    [t, tDictionary, isStaff]
  );

  const table = useTable({
    features: appTableFeatures,
    columns,
    data: data ?? [],
  });

  // One header for every state, so loading, error and empty are not three
  // pages with no heading and no way to add the first type.
  //
  // The dialogs live here rather than in the branches below for the same
  // reason: the header's "New type" button renders in all four states, so a
  // dialog mounted only on the populated one leaves that button doing nothing
  // while the list is loading or has failed to load.
  const withHeader = (body: React.ReactNode) => (
    <div className="space-y-4">
      <PageHeader
        title={t("PageTitle")}
        description={t("PageDescription")}
        actions={
          isStaff ? (
            <Button onClick={() => setFormRow(null)}>{t("CreateType")}</Button>
          ) : undefined
        }
      />
      {isStaff && (
        <>
          <MonitoringTypeFormDialog
            data={formRow ?? undefined}
            open={formRow !== undefined}
            onOpenChange={(open) => setFormRow(open ? formRow : undefined)}
          />
          <DeleteMonitoringTypeDialog
            data={deleteRow ?? undefined}
            open={!!deleteRow}
            onOpenChange={(open) => setDeleteRow(open ? deleteRow : null)}
          />
        </>
      )}
      {body}
    </div>
  );

  if (isPending) {
    return withHeader(<LoadingState label={tLoading("monitoringTypes")} />);
  }

  if (error) {
    return withHeader(
      <div
        role="alert"
        className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10"
      >
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-destructive">{t("ErrorTitle")}</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // `isPending` above already covers `data === undefined`, so this has to test
  // the genuinely-empty list or it can never render.
  if (!data || data.length === 0) {
    return withHeader(
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{t("EmptyStateTitle")}</p>
        <p className="text-sm text-muted-foreground">
          {/* only staff can act on the empty state, so a viewer is told the
              list is empty rather than being asked to create one */}
          {isStaff ? t("EmptyStateDescription") : t("EmptyStateDescriptionDetail")}
        </p>
      </div>
    );
  }

  return withHeader(<DataTable table={table} columns={columns} />);
};

export default MonitoringTypesPage;
