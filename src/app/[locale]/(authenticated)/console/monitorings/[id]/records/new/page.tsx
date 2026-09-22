"use client";

import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { RecordForm } from "@/components/app/record-form";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api/list";
import { RecordShell } from "../_shell";

const NewRecordPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const monitoringId = Number(use(params).id);
  const t = useTranslations("/console/monitorings.Records");
  const locale = useLocale();
  const router = useRouter();

  const types = useList_MonitoringType_API();
  const monitoring = types.data?.find((item) => item.id === monitoringId);
  const listPath = `/console/monitorings/${monitoringId}/records`;

  return (
    <RecordShell
      monitoringId={monitoringId}
      title={t("AddRecord")}
      description={
        monitoring
          ? locale === "fa"
            ? monitoring.name_fa
            : monitoring.name_en
          : undefined
      }
      loading={types.isPending}
      missing={!monitoring}
    >
      {monitoring ? (
        <RecordForm
          monitoring={monitoring}
          onSaved={() => router.push(listPath)}
          onExisting={(id) => router.push(`${listPath}/${id}/edit`)}
        />
      ) : null}
    </RecordShell>
  );
};

export default NewRecordPage;
