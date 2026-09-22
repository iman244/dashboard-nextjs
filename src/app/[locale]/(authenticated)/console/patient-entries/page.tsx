"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Inbox } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/app/page-header";
import { LoadingState } from "@/components/app/loading-state";
import { EntryForm } from "@/components/app/patient-entry-form";
import { useList_SBHM_API } from "@/data/saderat-bank-health-monitoring/api";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api/list";
import { asFieldSchema } from "@/components/schema-form";
import { formatDate, localeDigits } from "@/lib/utils";

/**
 * Where an operator records one patient's monitoring information.
 *
 * Two choices before any typing: which batch of monitoring this belongs to,
 * and which patient. The form under them is generated from the batch's type,
 * so this page has no idea what fields it is about to show -- that is the
 * whole point of the schema.
 */
const PatientEntriesPage = () => {
  const t = useTranslations("/console/patient-entries");
  const tLoading = useTranslations("common.Loading");
  const locale = useLocale();

  const monitorings = useList_SBHM_API();
  const types = useList_MonitoringType_API();

  const [selectedId, setSelectedId] = React.useState<string>("");

  const selected = monitorings.data?.find(
    (monitoring) => String(monitoring.id) === selectedId
  );
  const type = types.data?.find(
    (candidate) => candidate.slug === selected?.type
  );
  const declaresFields =
    type !== undefined && asFieldSchema(type.field_schema).fields.length > 0;

  const body = () => {
    if (monitorings.isPending || types.isPending) {
      return <LoadingState label={tLoading("Loading")} />;
    }

    if (monitorings.error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>{t("LoadFailed")}</AlertTitle>
          <AlertDescription>{monitorings.error.message}</AlertDescription>
        </Alert>
      );
    }

    if ((monitorings.data ?? []).length === 0) {
      return (
        <Alert>
          <Inbox className="size-4" aria-hidden="true" />
          <AlertTitle>{t("NoMonitorings")}</AlertTitle>
          <AlertDescription>{t("NoMonitoringsHint")}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="monitoring">{t("Monitoring")}</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger id="monitoring" className="w-full">
              <SelectValue placeholder={t("MonitoringPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {(monitorings.data ?? []).map((monitoring) => (
                <SelectItem key={monitoring.id} value={String(monitoring.id)}>
                  {localeDigits(monitoring.name, locale)}
                  {" — "}
                  {localeDigits(
                    formatDate(new Date(monitoring.created_at), locale),
                    locale
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selected ? (
          <p className="text-muted-foreground text-sm">
            {t("ChooseMonitoring")}
          </p>
        ) : !declaresFields ? (
          // Not an error: a type may legitimately collect nothing but Excel.
          <Alert>
            <AlertCircle className="size-4" aria-hidden="true" />
            <AlertTitle>{t("TypeHasNoFields")}</AlertTitle>
            <AlertDescription>{t("TypeHasNoFieldsHint")}</AlertDescription>
          </Alert>
        ) : (
          <EntryForm monitoring={selected.id} type={type} />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("PageTitle")} description={t("PageDescription")} />
      {body()}
    </div>
  );
};

export default PatientEntriesPage;
