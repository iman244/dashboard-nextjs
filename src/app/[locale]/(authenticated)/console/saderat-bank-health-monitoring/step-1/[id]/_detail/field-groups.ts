import type { SBHM_Step1Record } from "@/data/saderat-bank-health-monitoring/types";
import type { FieldGroup } from "../../../_detail/record-cards";

/**
 * Every step_1 column, grouped for the per-person view.
 *
 * Covers all 96 fields. Group keys are shared with step_2 wherever the two
 * forms describe the same thing, so a reader moving between the steps meets
 * the same sections in the same order; `labs`, `urinalysis`, `dental` and
 * `imaging` have no step_2 counterpart because step_2 records no measurements,
 * and `ecg` here is one interpretation field against step_2's full waveform
 * block.
 *
 * Fields are typed, so a column that stops existing upstream is a compile
 * error rather than a silently blank card.
 */
export const STEP1_FIELD_GROUPS: FieldGroup<keyof SBHM_Step1Record>[] = [
  {
    titleKey: "groups.identity",
    fields: [
      "نام",
      "نام خانوادگی",
      "نام پدر",
      "personel.کد ملی",
      "تجمیع نتایج.کد ملی",
      "جنسیت",
      "سن",
      "تاریخ",
    ],
  },
  {
    titleKey: "groups.vitals",
    fields: [
      "قد",
      "وزن",
      "BMI",
      "BMI_Group",
      "Sys_Bp",
      "Dia_BP",
      "BP_Group",
      "نبض",
      "تعداد نبض",
    ],
  },
  {
    titleKey: "groups.labs",
    fields: [
      "CBC/Hb",
      "CBC/Hct",
      "CBC/RBC",
      "CBC/WBC",
      "CBC/Plat",
      "CBC/MCH",
      "CBC/MCV",
      "CBC/MCHC",
      "FBS",
      "Hb-A1C",
      "Total Chol",
      "HDL",
      "LDL",
      "TG",
      "Urea",
      "Cr",
      "SGOT(AST)",
      "SGPT(ALT)",
      "Alkaline Phosphatase",
      "bilirubin-direct",
      "TSH",
      "T3",
      "T4",
      "PSA",
      "Ferritin",
      "Vit D",
      "vitamin b12",
      "K",
      "P",
      "Na",
      "ca",
    ],
  },
  {
    titleKey: "groups.urinalysis",
    fields: [
      "U_A/Glu",
      "U_A/Prot",
      "U_A/Blood",
      "U_A/Ketone",
      "U_A/RBC",
      "U_A/WBC",
      "U_A/Bact",
      "U_A/crystal",
    ],
  },
  {
    titleKey: "groups.ecg",
    fields: ["تفسیر الکتروکاردیوگرام", "مشاوره قلب", "بیماریهای عضلانی قلب"],
  },
  {
    titleKey: "groups.clinicalExam",
    fields: [
      "علائم عمومی",
      "قلب",
      "گوارش",
      "سیستم تنفسی",
      "نورولوژی",
      "سر و گردن",
      "هماتولوژی",
      "روماتولوژی",
      "اندوکرینولوژی",
      "سایکولوژی",
      "پستان",
      "معاینات بالینی زنان",
      "پاپ اسمیر",
      "تناسلی مردان",
    ],
  },
  {
    titleKey: "groups.musculoskeletal",
    fields: [
      "سیستم عضلانی اسکلتی فوقانی",
      "سیستم عضلانی اسکلتی تحتانی",
      "ستون فقرات پشتی و کمری",
    ],
  },
  {
    titleKey: "groups.dental",
    fields: [
      "دهان و حلق و دندان",
      "معاینه بالینی ENT",
      "تعداد دندان پوسیده _ D",
      "تعداد دندان غیرموجود _ M",
      "تعداد دندان ترمیم شده _ F",
    ],
  },
  {
    titleKey: "groups.imaging",
    fields: ["رادیوگرافی قفسه سینه", "سونوگرافی شکم و لگن"],
  },
  {
    titleKey: "groups.medicalHistory",
    fields: ["تاریخچه قبلی پزشکی"],
  },
  {
    titleKey: "groups.occupationalRisk",
    fields: ["عوامل زیان آورشغلی"],
  },
  {
    titleKey: "groups.followUp",
    fields: ["توصیه های عمومی", "اقدامات و مشاوره های موردنیاز"],
  },
  {
    titleKey: "groups.administrative",
    fields: [
      "سال",
      "کدپایش",
      "بيمه",
      "اپراتور",
      "نام صنعت",
      "name_goroh",
      "ID_SANAT",
      "ID_goroh",
      "ID_shobeh",
    ],
  },
];
