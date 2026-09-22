"use client";

import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { RecordForm } from "@/components/app/record-form";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api/list";
import { useRetrieve_PatientEntry_API } from "@/data/patient-entry/api/retrieve";
import { localeDigits } from "@/lib/utils";
import { RecordShell } from "../../_shell";

const EditRecordPage = ({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) => {
  const resolved = use(params);
  const monitoringId = Number(resolved.id);
  const recordId = Number(resolved.recordId);
  const t = useTranslations("/console/monitorings.Records");
  const locale = useLocale();
  const router = useRouter();

  const types = useList_MonitoringType_API();
  const monitoring = types.data?.find((item) => item.id === monitoringId);
  const record = useRetrieve_PatientEntry_API(recordId);
  const listPath = `/console/monitorings/${monitoringId}/records`;

  // A record id from another monitoring's URL is treated as not found rather
  // than edited against the wrong schema.
  const belongs = record.data?.monitoring === monitoringId;

  return (
    <RecordShell
      monitoringId={monitoringId}
      title={t("EditRecord")}
      description={
        record.data
          ? localeDigits(record.data.national_id, locale)
          : undefined
      }
      loading={types.isPending || record.isPending}
      missing={!monitoring || !record.data || !belongs}
    >
      {monitoring && record.data && belongs ? (
        <RecordForm
          // Remounted per record, so its stored values seed state directly.
          key={record.data.id}
          monitoring={monitoring}
          entry={record.data}
          onSaved={() => router.push(listPath)}
          onExisting={(id) => router.push(`${listPath}/${id}/edit`)}
        />
      ) : null}
    </RecordShell>
  );
};

export default EditRecordPage;
