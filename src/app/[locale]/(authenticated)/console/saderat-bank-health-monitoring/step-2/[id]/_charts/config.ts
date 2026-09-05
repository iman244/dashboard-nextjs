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
};

export type ChartSection = {
  titleKey: string;
  charts: DistributionChartSpec[];
};

/**
 * Fields chosen against the real payload (monitoring id 7, 546 records), not
 * guessed from the type. Coverage comments come from that data. Anything under
 * ~50% filled was dropped as unreadable, except `پستان`, which is
 * gender-conditional: 134/156 women, 5/389 men.
 *
 * `نام منطقه` was dropped despite 236 rows: it is 233x "مشهد" plus three
 * one-off values, so the chart carries no information.
 */
export const STEP2_CHART_SECTIONS: ChartSection[] = [
  {
    titleKey: "sections.demographics",
    charts: [
      // 545/546 filled, 2 distinct
      { field: "جنسیت", titleKey: "charts.gender" },
    ],
  },
  {
    titleKey: "sections.vitals",
    charts: [
      // 536/546 filled, 9 distinct
      { field: "Respiratory rate", titleKey: "charts.respiratoryRate" },
      // 453/546 filled, 3 distinct
      { field: "Heart rate:", titleKey: "charts.heartRate" },
    ],
  },
  {
    titleKey: "sections.clinicalExam",
    charts: [
      // 421/546 filled, 10 distinct
      { field: "قلب", titleKey: "charts.heart" },
      // 415/546 filled, 23 distinct
      { field: "گوارش", titleKey: "charts.digestive" },
      // 530/546 filled, 4 distinct
      { field: "نورولوژی", titleKey: "charts.neurology" },
      // 523/546 filled, 5 distinct
      { field: "سر و گردن", titleKey: "charts.headNeck" },
      // 530/546 filled, 3 distinct
      { field: "سيستم تنفسي", titleKey: "charts.respiratory" },
      // 533/546 filled, 4 distinct
      { field: "هماتولوژي", titleKey: "charts.hematology" },
      // 533/546 filled, 2 distinct
      { field: "روماتولوژي", titleKey: "charts.rheumatology" },
      // 519/546 filled, 7 distinct
      { field: "اندوكرينولوژي", titleKey: "charts.endocrinology" },
      // 534/546 filled, 18 distinct
      { field: "پوست و  مو", titleKey: "charts.skinHair" },
      // 531/546 filled, 6 distinct
      { field: "علائم عمومي", titleKey: "charts.generalSymptoms" },
      // 139/546 filled, 3 distinct
      { field: "پستان", titleKey: "charts.breast" },
    ],
  },
  {
    titleKey: "sections.musculoskeletal",
    charts: [
      // 514/546 filled, 12 distinct
      { field: "سيستم عضلاني اسكلتي فوقان", titleKey: "charts.upperLimb" },
      // 521/546 filled, 5 distinct
      { field: "سيستم عضلاني اسكلتي تحتاني", titleKey: "charts.lowerLimb" },
      // 492/546 filled, 6 distinct
      { field: "ستون فقرات پشتی و کمری", titleKey: "charts.spine" },
    ],
  },
  {
    titleKey: "sections.medicalHistory",
    charts: [
      // 385/546 filled, 2 distinct
      { field: "آيا سابقه عمل جراحي داريد ؟ذكر نمايد.", titleKey: "charts.surgeryHistory" },
      // 359/546 filled, 2 distinct
      { field: "آيا دارو خاصي مصرف مي كنيد؟ذكرنماييد.", titleKey: "charts.medication" },
      // 351/546 filled, 2 distinct
      { field: "آيا سابقه بيماري ارثي درخانواده داريد ؟نام  ببريد.", titleKey: "charts.hereditaryDisease" },
    ],
  },
  {
    titleKey: "sections.occupationalRisk",
    charts: [
      // 509/546 filled, 2 distinct
      { field: "آيا سيگارميكشيد؟", titleKey: "charts.smoking" },
      // 521/546 filled, 8 distinct
      { field: "عوامل ارگونوميك", titleKey: "charts.ergonomicFactors" },
      // 311/546 filled, 3 distinct
      { field: "عوامل  رواني", titleKey: "charts.psychologicalFactors" },
    ],
  },
  {
    titleKey: "sections.followUp",
    charts: [
      // 508/546 filled, 10 distinct
      { field: "آزمایشات تکمیلی مورد نیاز", titleKey: "charts.additionalTests" },
    ],
  },
];

/** Flat list, used to compute exactly the distributions that get rendered. */
export const STEP2_CHART_FIELDS: (keyof SBHM_Step2Record)[] =
  STEP2_CHART_SECTIONS.flatMap((s) => s.charts.map((c) => c.field));
