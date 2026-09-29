"use client";
import { useRetrieve_SBHM_API } from "@/data/saderat-bank-health-monitoring/api/retrieve";
import { useList_MonitoringType_API } from "@/data/monitoring-type/api";

/** The campaign (MonitoringType id) an upload belongs to. */
export const useUploadCampaign = (uploadId: number) => {
  const upload = useRetrieve_SBHM_API({ input: { pathVariables: { id: uploadId } } });
  const types = useList_MonitoringType_API();
  const campaignId = types.data?.find((t) => t.slug === upload.data?.type)?.id;
  return { campaignId, isPending: upload.isPending || types.isPending, isError: upload.isError || types.isError };
};
