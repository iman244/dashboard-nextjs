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
 * URL segment per step. The two steps have unrelated record shapes, so each
 * gets its own route rather than one `[step]` segment branching at runtime.
 * Like SBHM_TYPE_LABEL_KEYS, `satisfies` makes a new backend step fail to
 * compile here until its route is added.
 */
const SBHM_TYPE_SEGMENTS = {
  step_1: "step-1",
  step_2: "step-2",
} as const satisfies Record<SBHM_Type, string>;

/** Detail route for a monitoring, chosen by its step. */
export const SBHM_DETAIL_PATH = (type: SBHM_Type, id: number) =>
  `/console/saderat-bank-health-monitoring/${SBHM_TYPE_SEGMENTS[type]}/${id}`;

/**
 * The generated schema types `json` as `unknown`, since a Django JSONField
 * carries no shape. SBHM_Step1Record and SBHM_Step2Record below are the
 * hand-maintained shapes of the rows each Excel import produces.
 *
 * NOTE: `json` is typed as step_1 rows only. A step_2 response actually
 * carries SBHM_Step2Record[]. Making this a union discriminated on `type`
 * is the correct model, but `keyof` over a union collapses to the shared
 * keys, which breaks the ~1500-line step_1 detail page in 99 places. Left
 * as a deliberate follow-up; see SBHM_Retrieve_ByType below for the shape
 * step_2 UI should be written against.
 */
export type SaderatBankHealthMonitoring = Omit<
  Schemas["SaderatBankHealthMonitoringRetrieve"],
  "json"
> & {
  json: SBHM_Step1Record[];
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

export type SBHM_Step1Record = {
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

/**
 * Shape of one step_2 row. Almost every field is optional: the Excel import
 * produces sparse rows and a missing column is normal, not an error.
 *
 * Fields typed `unknown` were only ever seen empty, so their real type is not
 * known yet. Narrow at the point of use rather than widening this to `any`.
 *
 * Keys are transcribed verbatim from the import, including duplicated columns
 * suffixed `.1` and the inconsistent Arabic/Persian ی/ي and ک/ك spellings.
 * Do not "fix" the spelling here: these strings must match the payload byte
 * for byte or the lookup silently misses.
 */
export type SBHM_Step2Record = {
  Bp?: string
  Spo2?: string
  سن?: string
  Height?: number
  Weight?: number
  قلب?: string
  متن: unknown
  نام?: string
  "P wave:"?: string
  "Q wave:"?: string
  "U wave:"?: string
  "T wave :"?: string
  بیمه?: string
  "Heart rate"?: number
  Temprature?: string
  جنسیت?: string
  متخصص: unknown
  پستان?: string
  گوارش?: string
  "Heart rate:"?: string
  "ST segment:"?: string
  "کد ملی"?: number
  "PR: Interval"?: string
  "QRS complex:"?: string
  "QT interval:"?: string
  موبایل?: number
  "کد شعبه"?: number
  "ECG Diagnisis:"?: string
  "نام شعبه"?: string
  "کد منطقه"?: number
  "Respiratory rate"?: number
  "سر و گردن"?: string
  نورولوژی?: string
  "طرح درمان": unknown
  "عنوان شغل"?: string
  "نام منطقه"?: string
  "پوست و  مو"?: string
  "نورولوژی.1"?: string
  هماتولوژي?: string
  "ترشح پستان": unknown
  روماتولوژي?: string
  "توضیحات قلب"?: string
  "سيستم تنفسي"?: string
  "شماره پرسنل"?: number
  "علائم عمومي"?: string
  "نوع استخدام"?: string
  "عوامل  رواني"?: string
  "عوامل فیزیکی"?: string
  "نام خانوادگی"?: string
  "عوامل  رواني.1"?: string
  "توضیحات گوارش"?: string
  "عوامل شيميايي"?: string
  "عوامل فیزیکی.1": unknown
  "مشکلات بالینی"?: string
  اندوكرينولوژي?: string
  "عوامل بيولوژيك": unknown
  "عوامل شيميايي.1"?: string
  "دندان هاي دائمي": unknown
  "بینی و سینوس‌ها"?: string
  "عوامل ارگونوميك"?: string
  "عوامل بيولوژيك.1": unknown
  "توصیه‌های عمومی"?: string
  "نتيجه ماموگرافي*"?: string
  "آيا سيگارميكشيد؟"?: string
  "تصاویر سونوگرافی": unknown
  "توضیحات سر و گردن"?: string
  "توضیحات نورولوژی"?: string
  "عوامل ارگونوميك.1"?: string
  "دهان و حلق و دندان"?: string
  "نتيجه ماموگرافي*.1"?: string
  "وضعيت ظاهري پستان"?: string
  "توضیحات سایکولوژی"?: string
  "توضیحات هماتولوژي"?: string
  "سونگرافي شكم و لگن"?: string
  "مشکلات آزمایشگاهی"?: string
  "تصاویر جواب آژمایش": unknown
  "توضیحات روماتولوژي"?: string
  "سونوگرافي شكم و لگن"?: string
  "معاينات ‍ژنيكولوژي*"?: string
  "تعداد نخ سیگار در روز"?: string
  "راديوگرافي قفسه سينه": unknown
  "توضیحات در مورد پستان"?: string
  "روش پيشگيري از حاملگي"?: string
  "راديوگرافي قفسه سينه.1"?: string
  "ستون فقرات پشتی و کمری"?: string
  "بيماري هاي عضلاني قلبي"?: string
  "توضیحات  ارزيابي تنفسي"?: string
  "توضیحات اندوكرينولوژي"?: string
  "توضیحات بینی و سینوس‌ها"?: string
  "توضیحات توصیه‌های عمومی": unknown
  "توضیحات نتيجه ماموگرافي*"?: string
  "سایر موارد معاینات پستان"?: string
  "آزمایشات تکمیلی مورد نیاز"?: string
  "توضیحات دهان و حلق و دندان"?: string
  "توضیحاتسونگرافي شكم و لگن"?: string
  "سيستم عضلاني اسكلتي فوقان"?: string
  "آيا سابقه تزريق  خون داريد؟"?: string
  "سيستم عضلاني اسكلتي تحتاني"?: string
  "مدت به سال استفاده از سیگار"?: string
  "توضیخات سونوگرافي شكم و لگن"?: string
  "مشاوره‌های تخصصی مورد نیاز"?: string
  "آيا در محل كار سيگار مي كشيد؟"?: string
  "توضیحات معاينات ‍ژنيكولوژي*"?: string
  "توضیخات راديوگرافي قفسه سينه"?: string
  "آيافواصل قاعدگي شما منظم است؟"?: string
  "دندان هاي ترميم شده و اندو شده"?: string
  "شرح نسخه ها و مشاوره های تخصصی"?: string
  "توضیحات ستون فقرات پشتی و کمری"?: string
  "توضیحات نتيجه نمونه پاپ اسمير*"?: string
  "تعداد نخ سیگار در روز (در گذشته)"?: string
  "لگن و ارگان تناسلي ادراري(زنان)"?: string
  "توضیحات  بيماري هاي عضلاني قلبي": unknown
  "توضیحات تفسير الكتروكارديوگرام"?: string
  "لگن  و ارگان تناسلي ادراري (مردان)"?: string
  "آيا سابقه بيماري هاي ذيل را داريد؟"?: string
  "توضیحات آزمایشات تکمیلی مورد نیاز"?: string
  "توضیحات سيستم عضلاني اسكلتي فوقان"?: string
  "توضیحات آيا سابقه تزريق  خون داريد؟"?: string
  "توضیحات سيستم عضلاني اسكلتي تحتانی"?: string
  "تاریخ شرح نسخه ها و مشاوره های تخصصی": unknown
  "توضیحات مشاوره‌های تخصصی مورد نیاز"?: string
  "آيا سابقه عمل جراحي داريد ؟ذكر نمايد."?: string
  "توضیحات آيا سابقه بيماري ديگري داريد"?: string
  "مدت به سال استفاده از سیگار (در گذشته)"?: number
  "آيا دارو خاصي مصرف مي كنيد؟ذكرنماييد."?: string
  "آيا تا كنون به حادثه شغلي دچار شده ايد؟"?: string
  "توضیحات لگن و ارگان تناسلي ادراري(زنان)"?: string
  "آيا سابقه بيماري ديگري داريد؟ذكرنمائيد."?: string
  "آيا به غذا,دارويا ماده خاصي حساسيت داريد؟"?: string
  "توضیحات لگن  و ارگان تناسلي ادراري (مردان)"?: string
  "آيا درحال حاضر بيماري مرتبط با زنان داريد؟"?: string
  "آيا سابقه معرفي به كميسيون پزشكي را داريد؟"?: string
  "آيا منزل شما درمجاورت مركز صنعتي قراردارد؟"?: string
  "توضیحات ساير يافته ها راديوگرافي قفسه سينه": unknown
  "توضیحات آيا سابقه عمل جراحي داريد ؟ذكر نمايد."?: string
  "توضیحات آيا دارو خاصي مصرف مي كنيد؟ذكرنماييد."?: string
  "توضیحات آيا تا كنون به حادثه شغلي دچار شده ايد؟": unknown
  "آيا تا كنون معاينات  بدو استخدام انجام داده ايد؟"?: string
  "توضیحات آيا به غذا,دارويا ماده خاصي حساسيت داريد؟"?: string
  "آيا سابقه بيماري ارثي درخانواده داريد ؟نام  ببريد."?: string
  "توضیحات آيا سابقه معرفي به كميسيون پزشكي را داريد؟"?: string
  "توضیحات آيا منزل شما درمجاورت مركز صنعتي قراردارد؟": unknown
  "آيا سابقه عمل جراحي يا بيماري مرتبط با زنان را داشته ايد؟"?: string
  "آيا سابقه سرطان يا بيماري مزمن درخانواده داريد؟ذكرنماييد."?: string
  "آيا سابقه غيبت از محل كار به دليل بيماري بيش از 3 روز داريد؟"?: string
  "توضیحات آيا سابقه بيماري ارثي درخانواده داريد ؟نام  ببريد."?: string
  "درصورت منفي بودن  سوال فوق آيا در گذشته سيگار مي كشيده ايد؟"?: string
  "درصورت ابتلا به بيماري آيا علايم شما درمحيط كار تغيير ميكند؟"?: string
  "توضیحات آيا سابقه سرطان يا بيماري مزمن درخانواده داريد؟ذكرنماييد."?: string
  "توضیحات آيا سابقه غيبت از محل كار به دليل بيماري بيش از 3 روز داريد؟"?: string
  "درصورت ابتلا به بيماري آيا همكاران شما علايم مشابه درمحل كار دارند؟"?: string
  "توضیحات درصورت ابتلا به بيماري آيا علايم شما درمحيط كار تغيير ميكند؟": unknown
  "توضیحات درصورت ابتلا به بيماري آيا همكاران شما علايم مشابه درمحل كار دارند؟"?: string
  "درصورت ابتلا به بيماري آيا علايم شمادر زمان تعطيلات و مرخصي ها تغيير مي كند؟"?: string
  "توضیحات درصورت ابتلا به بيماري آيا علايم شمادر زمان تعطيلات و مرخصي ها تغيير مي كند؟": unknown
}

/** A row from either import. */
export type SBHM_AnyRecord = SBHM_Step1Record | SBHM_Step2Record;

/**
 * The retrieve response narrowed by `type`. Use this in step_2 UI, and prefer
 * it over SBHM_RetrieveSerializer for anything new:
 *
 *   const m: SBHM_Retrieve_ByType = ...
 *   if (m.type === "step_2") m.json // SBHM_Step2Record[]
 *
 * SBHM_RetrieveSerializer still types `json` as step_1 rows so the existing
 * detail page keeps compiling; migrating it to this type is the follow-up.
 */
export type SBHM_Retrieve_ByType =
  | (Omit<SaderatBankHealthMonitoring, "type" | "json"> & {
      type: "step_1";
      json: SBHM_Step1Record[];
    })
  | (Omit<SaderatBankHealthMonitoring, "type" | "json"> & {
      type: "step_2";
      json: SBHM_Step2Record[];
    });
