"use client";

import { useLocale, useTranslations } from "next-intl";
import { localeDigits } from "@/lib/utils";
import { isRtlLocale } from "@/lib/direction";
import type { UploadIssue } from "@/data/saderat-bank-health-monitoring/api/upload-excel";
import type { MonitoringType_ListSerializer } from "@/data/monitoring-type/types";

/**
 * Turns Django's upload issue codes into the sentences the upload page shows,
 * in Persian or English. Row lists (`blank_ids`, `invalid_ids`,
 * `duplicate_ids`) are capped at 20 server-side; `count` is the true total, so
 * an "and N more" line only appears once there is more than what was sent.
 * `missing_id_column.found` is capped at 20 too; `missing_columns.columns`
 * is not capped at all. Neither carries a `count`, so there is no total to
 * show an "and N more" line against for either.
 */
export function UploadIssues({
  issues,
  campaigns,
}: {
  issues: UploadIssue[];
  campaigns: MonitoringType_ListSerializer;
}) {
  const t = useTranslations(
    "/console/saderat-bank-health-monitoring.UploadSaderatBankHealthMonitoringExcelDialog"
  );
  const locale = useLocale();
  const rtl = isRtlLocale(locale);
  const sep = rtl ? "، " : ", ";

  const joinStrings = (values: string[]) => values.join(sep);
  const joinNumbers = (values: number[]) =>
    joinStrings(values.map((value) => localeDigits(value, locale)));

  // The server sends the full `count` alongside a list capped at 20, so "and
  // N more" compares the two rather than trusting the list length is the total.
  const withMore = (joined: string, total: number, listed: number) =>
    total > listed
      ? `${joined}${sep}${t("issues.more", { count: localeDigits(total - listed, locale) })}`
      : joined;

  const localizedCampaignName = (slug: string) => {
    const campaign = campaigns.find((type) => type.slug === slug);
    if (!campaign) return slug;
    return locale === "fa" ? campaign.name_fa : campaign.name_en;
  };

  return (
    <ul className="list-disc ps-4 space-y-2">
      {issues.map((issue, index) => {
        switch (issue.code) {
          case "unreadable":
            return (
              <li key={index}>
                {t("issues.unreadable")}
                <div className="mt-1">
                  <code dir="ltr" className="text-xs text-muted-foreground">
                    {issue.detail}
                  </code>
                </div>
              </li>
            );

          case "no_rows":
            return <li key={index}>{t("issues.no_rows")}</li>;

          case "missing_id_column":
            return (
              <li key={index}>
                {t.rich("issues.missing_id_column", {
                  column: issue.column,
                  found: joinStrings(issue.found),
                  bdi: (chunks) => <bdi>{chunks}</bdi>,
                })}
                {issue.looks_like && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("issues.looks_like", {
                      campaign: localizedCampaignName(issue.looks_like),
                    })}
                  </p>
                )}
              </li>
            );

          case "no_id_column":
            return <li key={index}>{t("issues.no_id_column")}</li>;

          case "blank_ids":
            return (
              <li key={index}>
                {t("issues.blank_ids", {
                  // A raw number, not a pre-localized string: the en message
                  // needs it plural-aware (ICU `{count, plural, ...}`), and
                  // the fa message formats it with `{count, number}` so it
                  // still renders Persian digits.
                  count: issue.count,
                  rows: withMore(
                    joinNumbers(issue.rows),
                    issue.count,
                    issue.rows.length
                  ),
                })}
              </li>
            );

          case "invalid_ids": {
            const entries = issue.rows.map(
              (row) =>
                `${localeDigits(row.row, locale)} (${localeDigits(row.value, locale)})`
            );
            return (
              <li key={index}>
                {t("issues.invalid_ids", {
                  count: issue.count,
                  rows: withMore(
                    joinStrings(entries),
                    issue.count,
                    issue.rows.length
                  ),
                })}
              </li>
            );
          }

          case "duplicate_ids": {
            const entries = issue.groups.map(
              (group) =>
                `${localeDigits(group.value, locale)} (${joinNumbers(group.rows)})`
            );
            return (
              <li key={index}>
                {t("issues.duplicate_ids", {
                  count: issue.count,
                  groups: withMore(
                    joinStrings(entries),
                    issue.count,
                    issue.groups.length
                  ),
                })}
              </li>
            );
          }

          case "missing_columns":
            return (
              <li key={index}>
                {t.rich("issues.missing_columns", {
                  columns: joinStrings(issue.columns),
                  bdi: (chunks) => <bdi>{chunks}</bdi>,
                })}
              </li>
            );

          default:
            return null;
        }
      })}
    </ul>
  );
}
