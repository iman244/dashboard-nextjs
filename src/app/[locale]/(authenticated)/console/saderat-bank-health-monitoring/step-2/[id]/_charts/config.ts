import type { SBHM_Step2Record } from "@/data/saderat-bank-health-monitoring/types";

/**
 * Every chart on the step-2 report, as data.
 *
 * The step-1 page hand-wrote this block 22 times and computed 45 distributions
 * it never rendered. Here the same array drives both the computation and the
 * render, so a chart cannot exist without its data and data cannot be computed
 * without a chart.
 *
 * `field` is `keyof SBHM_Step2Record`, so a mistyped key is a compile error
 * rather than an empty chart. Add a metric by adding one entry.
 */
export type DistributionChartSpec = {
  /** Record key to count. Typed, so typos fail the build. */
  field: keyof SBHM_Step2Record;
  /** Key under the Step2Report namespace. Never a literal string. */
  titleKey: string;
  /** 1-5, mapped to var(--chart-N). */
  color: 1 | 2 | 3 | 4 | 5;
};

export type ChartSection = {
  titleKey: string;
  charts: DistributionChartSpec[];
};

export const STEP2_CHART_SECTIONS: ChartSection[] = [
  {
    titleKey: "sections.demographics",
    charts: [
      { field: "جنسیت", titleKey: "charts.gender", color: 1 },
      { field: "نوع استخدام", titleKey: "charts.employmentType", color: 2 },
      { field: "نام منطقه", titleKey: "charts.region", color: 3 },
      { field: "عنوان شغل", titleKey: "charts.jobTitle", color: 4 },
    ],
  },
  {
    titleKey: "sections.clinicalExam",
    charts: [
      { field: "قلب", titleKey: "charts.heart", color: 1 },
      { field: "گوارش", titleKey: "charts.digestive", color: 2 },
      { field: "نورولوژی", titleKey: "charts.neurology", color: 3 },
      { field: "سر و گردن", titleKey: "charts.headNeck", color: 4 },
      { field: "سيستم تنفسي", titleKey: "charts.respiratory", color: 5 },
      { field: "هماتولوژي", titleKey: "charts.hematology", color: 1 },
      { field: "روماتولوژي", titleKey: "charts.rheumatology", color: 2 },
      { field: "اندوكرينولوژي", titleKey: "charts.endocrinology", color: 3 },
      { field: "پستان", titleKey: "charts.breast", color: 4 },
      { field: "بینی و سینوس‌ها", titleKey: "charts.sinuses", color: 5 },
      { field: "دهان و حلق و دندان", titleKey: "charts.dental", color: 1 },
      { field: "پوست و  مو", titleKey: "charts.skinHair", color: 2 },
      { field: "علائم عمومي", titleKey: "charts.generalSymptoms", color: 3 },
    ],
  },
  {
    titleKey: "sections.occupationalRisk",
    charts: [
      { field: "آيا سيگارميكشيد؟", titleKey: "charts.smoking", color: 1 },
      { field: "عوامل فیزیکی", titleKey: "charts.physicalFactors", color: 2 },
      { field: "عوامل شيميايي", titleKey: "charts.chemicalFactors", color: 3 },
      { field: "عوامل ارگونوميك", titleKey: "charts.ergonomicFactors", color: 4 },
      { field: "عوامل  رواني", titleKey: "charts.psychologicalFactors", color: 5 },
    ],
  },
];

/** Flat list, used to compute exactly the distributions that get rendered. */
export const STEP2_CHART_FIELDS: (keyof SBHM_Step2Record)[] =
  STEP2_CHART_SECTIONS.flatMap((s) => s.charts.map((c) => c.field));
