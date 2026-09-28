"use client";

import { useTranslations } from "next-intl";

/** What a row with no findings shows, so its card is never left blank. */
export const NoFindings = () => {
  const t = useTranslations("/console/monitorings.CampaignPatient");
  return <p className="text-sm text-muted-foreground">{t("noFindings")}</p>;
};
