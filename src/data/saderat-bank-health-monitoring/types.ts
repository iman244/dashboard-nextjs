import type { components } from "@/data/api-schema";

type Schemas = components["schemas"];

/**
 * `step_1` | `step_2`, generated from the Django model's TextChoices.
 * Adding a step on the backend and regenerating makes SBHM_TYPES below
 * fail to compile until the new value is handled here too.
 */
export type SBHM_Type = Schemas["TypeEnum"];

const SBHM_TYPE_LABEL_KEYS = {
  step_1: "Step1",
  step_2: "Step2",
} as const satisfies Record<SBHM_Type, string>;

export const SBHM_TYPES = Object.keys(SBHM_TYPE_LABEL_KEYS) as SBHM_Type[];

export const SBHM_TYPE_LABEL_KEY = (type: SBHM_Type) =>
  SBHM_TYPE_LABEL_KEYS[type];

/**
 * The generated schema types `json` as `unknown`, since a Django JSONField
 * carries no shape. SBHM_Record below is the hand-maintained shape of the
 * rows the Excel import produces.
 */
export type SaderatBankHealthMonitoring = Omit<
  Schemas["SaderatBankHealthMonitoringRetrieve"],
  "json"
> & {
  json: SBHM_Record[];
};

export type SBHM_ListSerializer = Schemas["SaderatBankHealthMonitoringList"][];
export type SBHM_RetrieveSerializer = SaderatBankHealthMonitoring;
export type SBHM_CreateSerializer =
  Schemas["SaderatBankHealthMonitoringListRequest"];

/** `file` is `string` (binary) in the schema; in the browser it is a File. */
export type SBHM_UploadExcelSerializer = Omit<
  Schemas["SaderatBankHealthMonitoringUploadExcelRequest"],
  "file"
> & {
  file: File;
};

type SBHM_Record = {
  K: string
  P: string
  Cr: string
  Na: string
  T3: string
  T4: string
  TG: string
  ca: string
  BMI: number
  FBS: string
  HDL: string
  LDL: string
  PSA: string
  TSH: string
  Urea: string
  سن: number
  قد: number
  "Vit D": string
  "CBC/Hb": string
  Dia_BP: number
  "Hb-A1C": string
  Sys_Bp: number
  سال: number
  قلب: string
  نام: string
  نبض: string
  وزن: number
  "CBC/Hct": string
  "CBC/MCH": string
  "CBC/MCV": string
  "CBC/RBC": string
  "CBC/WBC": string
  "U_A/Glu": string
  "U_A/RBC": string
  "U_A/WBC": string
  BP_Group: string
  "CBC/MCHC": string
  "CBC/Plat": string
  Ferritin: string
  ID_SANAT: number
  ID_goroh: number
  "U_A/Bact": string
  "U_A/Prot": string
  بيمه: string
  BMI_Group: string
  ID_shobeh: number
  "SGOT(AST)": string
  "SGPT(ALT)": string
  "U_A/Blood": string
  "Total Chol": string
  "U_A/Ketone": string
  name_goroh: string
  تاریخ: string
  جنسیت: string
  پستان: string
  گوارش: string
  "U_A/crystal": string
  "vitamin b12": string
  کدپایش: number
  "نام پدر": string
  اپراتور: string
  "نام صنعت": string
  "bilirubin-direct": string
  "سر و گردن": string
  نورولوژی: string
  "تعداد نبض": number
  "پاپ اسمیر": string
  سایکولوژی: string
  هماتولوژی: string
  "مشاوره قلب": string
  "Alkaline Phosphatase": string
  "personel.کد ملی": string
  روماتولوژی: string
  "سیستم تنفسی": string
  "علائم عمومی": string
  "تناسلی مردان": string
  "نام خانوادگی": string
  اندوکرینولوژی: string
  "توصیه های عمومی": string
  "معاینه بالینی ENT": string
  "دهان و حلق و دندان": string | number | null
  "تجمیع نتایج.کد ملی": string
  "تاریخچه قبلی پزشکی": string
  "عوامل زیان آورشغلی": string
  "سونوگرافی شکم و لگن": string
  "معاینات بالینی زنان": string
  "بیماریهای عضلانی قلب": string
  "تعداد دندان پوسیده _ D": string | number | null
  "رادیوگرافی قفسه سینه": string
  "ستون فقرات پشتی و کمری": string
  "تعداد دندان غیرموجود _ M": string | number | null
  "تعداد دندان ترمیم شده _ F": string | number | null
  "تفسیر الکتروکاردیوگرام": string
  "سیستم عضلانی اسکلتی تحتانی": string
  "سیستم عضلانی اسکلتی فوقانی": string
  "اقدامات و مشاوره های موردنیاز": string
}
