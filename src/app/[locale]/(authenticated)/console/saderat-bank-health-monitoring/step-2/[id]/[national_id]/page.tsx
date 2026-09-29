"use client";
import React from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { LoadingState } from "@/components/app/loading-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link, useRouter } from "@/i18n/navigation";
import { CAMPAIGN_PATIENT_PATH, fullNationalId, safeDecode } from "@/lib/national-id";
import { useUploadCampaign } from "../../../../monitorings/_reports/use-upload-campaign";

/** Bookmarked address for a Step 2 person; it now lives on the campaign page. */
export default function Page(
  props: PageProps<"/[locale]/console/saderat-bank-health-monitoring/step-2/[id]/[national_id]">
) {
  const { id, national_id } = React.use(props.params);
  const uploadId = Number(id);
  const nationalId = fullNationalId(safeDecode(national_id));
  const { campaignId, isPending, isError } = useUploadCampaign(uploadId);
  const router = useRouter();
  const t = useTranslations("/console/monitorings.Campaign");
  const tLoading = useTranslations("common.Loading");

  // Fire the replace once, not once per render pass, as `(authenticated)/layout.tsx` does.
  const navigated = React.useRef(false);
  React.useEffect(() => {
    if (campaignId === undefined) return;
    if (navigated.current) return;
    navigated.current = true;
    router.replace(CAMPAIGN_PATIENT_PATH(campaignId, nationalId));
  }, [campaignId, nationalId, router]);

  // A campaign that never resolves (bad id, failed types load, or a type
  // dropped from the list) is the same dead end as a network error.
  const failed = Number.isNaN(uploadId) || isError || (!isPending && campaignId === undefined);

  if (failed) {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" className="size-4" />
        <AlertTitle>{t("notFound")}</AlertTitle>
        <AlertDescription>
          <Link href="/console/monitorings" className="underline underline-offset-4">
            {t("backToList")}
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return <LoadingState label={tLoading("default")} />;
}
