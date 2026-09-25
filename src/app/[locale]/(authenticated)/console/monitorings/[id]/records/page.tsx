"use client";

import * as React from "react";
import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, Inbox, Pencil, Plus, Trash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { LoadingState } from "@/components/app/loading-state";
import { RowAction, RowActions } from "@/components/app";
import { Link } from "@/i18n/navigation";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api/list";
import { useList_PatientEntry_API } from "@/data/patient-entry/api/list";
import { asFieldSchema } from "@/components/schema-form";
import { formatDate, localeDigits } from "@/lib/utils";
import type { PatientEntry } from "@/data/patient-entry/types";
import { useIsStaff } from "@/data/user/fetches/me";
import { DeleteRecordDialog } from "./_delete-dialog";

/**
 * Every patient recorded under one monitoring.
 *
 * The monitoring comes from the URL, so nothing here asks which one -- that
 * was the point of moving records underneath it. Nothing on this page reads
 * the Excel blobs; the two stores are unrelated.
 */
const RecordsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const monitoringId = Number(id);

  const t = useTranslations("/console/monitorings.Records");
  const tDictionary = useTranslations("common.Dictionary");
  const tLoading = useTranslations("common.Loading");
  const locale = useLocale();
  // Records are readable by everyone signed in; adding, editing and deleting
  // are staff-only, as Django enforces.
  const isStaff = useIsStaff();

  const [deleting, setDeleting] = React.useState<PatientEntry | null>(null);

  const types = useList_MonitoringType_API();
  const monitoring = types.data?.find(
    (candidate) => candidate.id === monitoringId
  );

  const records = useList_PatientEntry_API({ monitoring: monitoringId });

  const declaresFields =
    monitoring !== undefined &&
    asFieldSchema(monitoring.field_schema).fields.length > 0;

  const name = monitoring
    ? locale === "fa"
      ? monitoring.name_fa
      : monitoring.name_en
    : "";

  const body = () => {
    if (types.isPending || records.isPending) {
      return <LoadingState label={tLoading("records")} />;
    }

    if (!monitoring) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>{t("LoadFailed")}</AlertTitle>
        </Alert>
      );
    }

    if (!declaresFields) {
      return (
        <Alert>
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>{t("TypeHasNoFields")}</AlertTitle>
          <AlertDescription>{t("TypeHasNoFieldsHint")}</AlertDescription>
        </Alert>
      );
    }

    if (records.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>{t("LoadFailed")}</AlertTitle>
          <AlertDescription>{records.error.message}</AlertDescription>
        </Alert>
      );
    }

    if ((records.data ?? []).length === 0) {
      return (
        <Alert>
          <Inbox className="size-4" aria-hidden="true" />
          <AlertTitle>{t("NoRecords")}</AlertTitle>
          <AlertDescription>{t("NoRecordsHint")}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("NationalIdColumn")}</TableHead>
              <TableHead>{t("FilesColumn")}</TableHead>
              <TableHead>{t("UpdatedColumn")}</TableHead>
              {isStaff ? <TableHead>{tDictionary("Actions")}</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {(records.data ?? []).map((record) => (
              <TableRow key={record.id}>
                <TableCell dir="ltr" className="text-start font-medium">
                  {localeDigits(record.national_id, locale)}
                </TableCell>
                <TableCell>
                  {localeDigits((record.files ?? []).length, locale)}
                </TableCell>
                <TableCell>
                  {localeDigits(
                    formatDate(new Date(record.updated_at), locale),
                    locale
                  )}
                </TableCell>
                {isStaff ? (
                  <TableCell>
                    <RowActions>
                      <RowAction
                        icon={Pencil}
                        label={t("EditRecord")}
                        href={`/console/monitorings/${monitoringId}/records/${record.id}/edit`}
                      />
                      <RowAction
                        icon={Trash}
                        label={t("DeleteRecord")}
                        onClick={() => setDeleting(record)}
                      />
                    </RowActions>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("PageTitle")}
        description={name ? t("PageDescription", { name }) : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/console/monitorings">
                <ArrowLeft
                  className="size-4 rtl:rotate-180"
                  aria-hidden="true"
                />
                {t("BackToMonitorings")}
              </Link>
            </Button>
            {declaresFields && isStaff ? (
              // A page, not a dialog: a form with sections and image uploads
              // needs the room, and the URL can be shared or reopened.
              <Button asChild>
                <Link href={`/console/monitorings/${monitoringId}/records/new`}>
                  <Plus className="size-4" aria-hidden="true" />
                  {t("AddRecord")}
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {body()}

      {monitoring && isStaff ? (
        <>
          <DeleteRecordDialog
            record={deleting ?? undefined}
            open={deleting !== null}
            onOpenChange={(open) => setDeleting(open ? deleting : null)}
            onDeleted={() => {
              records.refetch();
              setDeleting(null);
            }}
          />
        </>
      ) : null}
    </div>
  );
};

export default RecordsPage;
