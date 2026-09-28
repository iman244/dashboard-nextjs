"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatCellValue } from "@/lib/utils";
import type { SBHM_Step2Record } from "@/data/saderat-bank-health-monitoring/types";
import {
  BadgeItem,
  SectionCard,
  StatCard,
  TextCard,
  isBlank,
} from "@/app/[locale]/(authenticated)/console/saderat-bank-health-monitoring/_detail/blocks";
import {
  DENSITY_GRID,
  STEP2_SECTIONS,
  STEP2_VITALS,
  fieldOf,
  iconOf,
} from "@/app/[locale]/(authenticated)/console/saderat-bank-health-monitoring/step-2/[id]/_detail/sections";
import { noteKeyFor } from "@/app/[locale]/(authenticated)/console/saderat-bank-health-monitoring/step-2/[id]/_detail/notes";
import { NoFindings } from "./no-findings";
import { Demographics } from "./demographics";

/** One step_2 record, laid out the way the step-1 person page lays out its own. */
export const Step2PersonSections = ({ row }: { row: SBHM_Step2Record }) => {
  const t = useTranslations("/console/saderat-bank-health-monitoring.Detail");
  const locale = useLocale();

  const vitals = STEP2_VITALS.filter((v) => !isBlank(row[v.field]));
  const sections = STEP2_SECTIONS.map((section) => {
    // a note belongs under the field it annotates, never as a row of its own
    const notes = new Set(
      section.fields
        .map((f) => noteKeyFor(fieldOf(f)))
        .filter((n): n is NonNullable<typeof n> => Boolean(n))
    );
    const entries = section.fields.filter((f) => {
      const field = fieldOf(f);
      return !notes.has(field) && !isBlank(row[field]);
    });
    return { section, entries };
  }).filter(({ entries }) => entries.length > 0);

  // Not a finding, so it never decides NoFindings below.
  const demographics = <Demographics row={row} fields={["age", "gender"]} />;

  // A row holding only name, age and ID would otherwise leave its card blank.
  if (vitals.length === 0 && sections.length === 0) {
    return (
      <>
        {demographics}
        <NoFindings />
      </>
    );
  }

  return (
    <>
      {demographics}
      {vitals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vitals.map((vital) => (
            <StatCard
              key={vital.field}
              icon={vital.icon}
              label={vital.field}
              unit={vital.unit}
              value={formatCellValue(row[vital.field] as string, locale)}
              group={
                vital.groupField
                  ? (row[vital.groupField] as string | null)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {sections.map(({ section, entries }) => {
        const grid = DENSITY_GRID[section.density];

        if (section.kind === "texts") {
          return (
            <div key={section.titleKey} className={grid}>
              {entries.map((entry) => {
                const field = fieldOf(entry);
                return (
                  <TextCard
                    key={field}
                    icon={section.icon}
                    title={field}
                    value={row[field]}
                  />
                );
              })}
            </div>
          );
        }

        return (
          <SectionCard
            key={section.titleKey}
            icon={section.icon}
            title={t(section.titleKey)}
          >
            <div className={grid}>
              {entries.map((entry) => {
                const field = fieldOf(entry);
                const noteKey = noteKeyFor(field);
                return (
                  <BadgeItem
                    key={field}
                    label={field}
                    icon={iconOf(entry)}
                    value={row[field] as string | number | null}
                    note={noteKey ? row[noteKey] : undefined}
                  />
                );
              })}
            </div>
          </SectionCard>
        );
      })}
    </>
  );
};
