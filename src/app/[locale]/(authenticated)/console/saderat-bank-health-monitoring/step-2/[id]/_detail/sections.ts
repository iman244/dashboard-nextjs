import {
  Activity,
  AlertCircle,
  Brain,
  Briefcase,
  Bone,
  Ear,
  FileText,
  Heart,
  Ruler,
  Stethoscope,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { SBHM_Step2Record } from "@/data/saderat-bank-health-monitoring/types";

type F = keyof SBHM_Step2Record;

/**
 * step_2 arranged into the sections the step-1 page uses.
 *
 * step-1 reads as vitals-as-stat-cards, then titled sections of verdict
 * badges, then full-width cards for free text. This is the same arrangement
 * over step_2's own columns; where step_2 has no counterpart — the ECG
 * waveform block, the occupational questionnaire — the section is new, but
 * the shape it renders in is not.
 *
 * Labels are the column names themselves. They are already Persian prose in
 * the workbook, so renaming them would be inventing a vocabulary the data
 * does not have.
 */

/** A vital sign, optionally paired with the column holding its verdict. */
export type VitalStat = {
  field: F;
  icon: LucideIcon;
  unit?: string;
  /** e.g. `Heart rate:` carries the verdict for `Heart rate`. */
  groupField?: F;
};

export const STEP2_VITALS: VitalStat[] = [
  { field: "Bp", icon: Heart },
  { field: "Heart rate", icon: Activity, unit: "bpm", groupField: "Heart rate:" },
  { field: "Respiratory rate", icon: Wind },
  { field: "Spo2", icon: Activity },
  { field: "Temprature", icon: Thermometer },
  { field: "Weight", icon: Ruler, unit: "kg" },
  { field: "Height", icon: Ruler, unit: "cm" },
];

export type Step2Section = {
  titleKey: string;
  icon: LucideIcon;
  /** "badges" renders a grid of verdicts; "texts" renders full-width prose. */
  kind: "badges" | "texts";
  fields: F[];
};

export const STEP2_SECTIONS: Step2Section[] = [
  {
    titleKey: "sections.ecg",
    icon: Heart,
    kind: "badges",
    fields: [
      "ECG Diagnisis:",
      "P wave:",
      "Q wave:",
      "T wave :",
      "U wave:",
      "PR: Interval",
      "QRS complex:",
      "QT interval:",
      "ST segment:",
      // orphan note: step_2 has no تفسير الكتروكارديوگرام field to attach to
      "توضیحات تفسير الكتروكارديوگرام",
    ],
  },
  {
    titleKey: "sections.clinicalExam",
    icon: Stethoscope,
    kind: "badges",
    fields: [
      "علائم عمومي",
      "قلب",
      "توضیحات قلب",
      "گوارش",
      "توضیحات گوارش",
      "سيستم تنفسي",
      "توضیحات  ارزيابي تنفسي",
      "نورولوژی",
      "نورولوژی.1",
      "توضیحات نورولوژی",
      "سر و گردن",
      "توضیحات سر و گردن",
      "بینی و سینوس‌ها",
      "توضیحات بینی و سینوس‌ها",
      "هماتولوژي",
      "توضیحات هماتولوژي",
      "روماتولوژي",
      "توضیحات روماتولوژي",
      "اندوكرينولوژي",
      "توضیحات اندوكرينولوژي",
      "توضیحات سایکولوژی",
      "پوست و  مو",
      "مشکلات بالینی",
      "مشکلات آزمایشگاهی",
    ],
  },
  {
    titleKey: "sections.dental",
    icon: Ear,
    kind: "badges",
    fields: [
      "دهان و حلق و دندان",
      "توضیحات دهان و حلق و دندان",
      "دندان هاي دائمي",
      "دندان هاي ترميم شده و اندو شده",
    ],
  },
  {
    titleKey: "sections.womensHealth",
    icon: Activity,
    kind: "badges",
    fields: [
      "پستان",
      "توضیحات در مورد پستان",
      "وضعيت ظاهري پستان",
      "ترشح پستان",
      "سایر موارد معاینات پستان",
      "معاينات ‍ژنيكولوژي*",
      "توضیحات معاينات ‍ژنيكولوژي*",
      "لگن و ارگان تناسلي ادراري(زنان)",
      "توضیحات لگن و ارگان تناسلي ادراري(زنان)",
      "لگن  و ارگان تناسلي ادراري (مردان)",
      "توضیحات لگن  و ارگان تناسلي ادراري (مردان)",
      "آيافواصل قاعدگي شما منظم است؟",
      "روش پيشگيري از حاملگي",
      "آيا درحال حاضر بيماري مرتبط با زنان داريد؟",
      "آيا سابقه عمل جراحي يا بيماري مرتبط با زنان را داشته ايد؟",
    ],
  },
  {
    titleKey: "sections.imaging",
    icon: FileText,
    kind: "badges",
    fields: [
      "راديوگرافي قفسه سينه",
      "راديوگرافي قفسه سينه.1",
      "توضیحات ساير يافته ها راديوگرافي قفسه سينه",
      "توضیخات راديوگرافي قفسه سينه",
      "سونوگرافي شكم و لگن",
      "توضیخات سونوگرافي شكم و لگن",
      "سونگرافي شكم و لگن",
      "توضیحاتسونگرافي شكم و لگن",
      "تصاویر سونوگرافی",
      "نتيجه ماموگرافي*",
      "نتيجه ماموگرافي*.1",
      "توضیحات نتيجه ماموگرافي*",
      "توضیحات نتيجه نمونه پاپ اسمير*",
      "تصاویر جواب آژمایش",
    ],
  },
  {
    titleKey: "sections.musculoskeletal",
    icon: Bone,
    kind: "badges",
    fields: [
      "سيستم عضلاني اسكلتي فوقان",
      "توضیحات سيستم عضلاني اسكلتي فوقان",
      "سيستم عضلاني اسكلتي تحتاني",
      "توضیحات سيستم عضلاني اسكلتي تحتانی",
      "ستون فقرات پشتی و کمری",
      "توضیحات ستون فقرات پشتی و کمری",
      "بيماري هاي عضلاني قلبي",
      "توضیحات  بيماري هاي عضلاني قلبي",
    ],
  },
  {
    titleKey: "sections.medicalHistory",
    icon: Brain,
    kind: "badges",
    fields: [
      "آيا سابقه بيماري هاي ذيل را داريد؟",
      "آيا سابقه بيماري ديگري داريد؟ذكرنمائيد.",
      "توضیحات آيا سابقه بيماري ديگري داريد",
      "آيا سابقه عمل جراحي داريد ؟ذكر نمايد.",
      "توضیحات آيا سابقه عمل جراحي داريد ؟ذكر نمايد.",
      "آيا دارو خاصي مصرف مي كنيد؟ذكرنماييد.",
      "توضیحات آيا دارو خاصي مصرف مي كنيد؟ذكرنماييد.",
      "آيا به غذا,دارويا ماده خاصي حساسيت داريد؟",
      "توضیحات آيا به غذا,دارويا ماده خاصي حساسيت داريد؟",
      "آيا سابقه تزريق  خون داريد؟",
      "توضیحات آيا سابقه تزريق  خون داريد؟",
      "آيا سابقه بيماري ارثي درخانواده داريد ؟نام  ببريد.",
      "توضیحات آيا سابقه بيماري ارثي درخانواده داريد ؟نام  ببريد.",
      "آيا سابقه سرطان يا بيماري مزمن درخانواده داريد؟ذكرنماييد.",
      "توضیحات آيا سابقه سرطان يا بيماري مزمن درخانواده داريد؟ذكرنماييد.",
      "آيا سابقه معرفي به كميسيون پزشكي را داريد؟",
      "توضیحات آيا سابقه معرفي به كميسيون پزشكي را داريد؟",
      "آيا تا كنون معاينات  بدو استخدام انجام داده ايد؟",
    ],
  },
  {
    titleKey: "sections.occupationalRisk",
    icon: Briefcase,
    kind: "badges",
    fields: [
      "عوامل فیزیکی",
      "عوامل فیزیکی.1",
      "عوامل شيميايي",
      "عوامل شيميايي.1",
      "عوامل بيولوژيك",
      "عوامل بيولوژيك.1",
      "عوامل ارگونوميك",
      "عوامل ارگونوميك.1",
      "عوامل  رواني",
      "عوامل  رواني.1",
      "آيا تا كنون به حادثه شغلي دچار شده ايد؟",
      "توضیحات آيا تا كنون به حادثه شغلي دچار شده ايد؟",
      "آيا سابقه غيبت از محل كار به دليل بيماري بيش از 3 روز داريد؟",
      "توضیحات آيا سابقه غيبت از محل كار به دليل بيماري بيش از 3 روز داريد؟",
      "درصورت ابتلا به بيماري آيا علايم شما درمحيط كار تغيير ميكند؟",
      "توضیحات درصورت ابتلا به بيماري آيا علايم شما درمحيط كار تغيير ميكند؟",
      "درصورت ابتلا به بيماري آيا همكاران شما علايم مشابه درمحل كار دارند؟",
      "توضیحات درصورت ابتلا به بيماري آيا همكاران شما علايم مشابه درمحل كار دارند؟",
      "درصورت ابتلا به بيماري آيا علايم شمادر زمان تعطيلات و مرخصي ها تغيير مي كند؟",
      "توضیحات درصورت ابتلا به بيماري آيا علايم شمادر زمان تعطيلات و مرخصي ها تغيير مي كند؟",
      "آيا منزل شما درمجاورت مركز صنعتي قراردارد؟",
      "توضیحات آيا منزل شما درمجاورت مركز صنعتي قراردارد؟",
    ],
  },
  {
    titleKey: "sections.smoking",
    icon: Wind,
    kind: "badges",
    fields: [
      "آيا سيگارميكشيد؟",
      "تعداد نخ سیگار در روز",
      "مدت به سال استفاده از سیگار",
      "آيا در محل كار سيگار مي كشيد؟",
      "درصورت منفي بودن  سوال فوق آيا در گذشته سيگار مي كشيده ايد؟",
      "تعداد نخ سیگار در روز (در گذشته)",
      "مدت به سال استفاده از سیگار (در گذشته)",
    ],
  },
  {
    titleKey: "sections.administrative",
    icon: Briefcase,
    kind: "badges",
    fields: [
      "شماره پرسنل",
      "عنوان شغل",
      "نوع استخدام",
      "نام شعبه",
      "کد شعبه",
      "نام منطقه",
      "کد منطقه",
      "موبایل",
      "متخصص",
      "متن",
      "بیمه",
    ],
  },
  {
    titleKey: "sections.followUp",
    icon: AlertCircle,
    kind: "texts",
    fields: [
      "توصیه‌های عمومی",
      "توضیحات توصیه‌های عمومی",
      "آزمایشات تکمیلی مورد نیاز",
      "توضیحات آزمایشات تکمیلی مورد نیاز",
      "مشاوره‌های تخصصی مورد نیاز",
      "توضیحات مشاوره‌های تخصصی مورد نیاز",
      "شرح نسخه ها و مشاوره های تخصصی",
      "تاریخ شرح نسخه ها و مشاوره های تخصصی",
      "طرح درمان",
    ],
  },
];
