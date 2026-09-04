import type { SBHM_Step2Record } from "@/data/saderat-bank-health-monitoring/types";

/**
 * Note field paired to `field`, if any.
 *
 * Most are "توضیحات " + the field name verbatim. Eight are not, because the
 * note and its base field disagree on spelling — e.g. the base ends "تحتاني"
 * while its note ends "تحتانی". Those are listed explicitly rather than
 * normalised, since both strings must match the payload exactly.
 */
const NOTE_OVERRIDES: Partial<Record<keyof SBHM_Step2Record, keyof SBHM_Step2Record>> = {
  "سيستم عضلاني اسكلتي تحتاني": "توضیحات سيستم عضلاني اسكلتي تحتانی",
  "سونگرافي شكم و لگن": "توضیحاتسونگرافي شكم و لگن",
  "سونوگرافي شكم و لگن": "توضیخات سونوگرافي شكم و لگن",
  "راديوگرافي قفسه سينه.1": "توضیخات راديوگرافي قفسه سينه",
  // note carries a double space after توضیحات
  "بيماري هاي عضلاني قلبي": "توضیحات  بيماري هاي عضلاني قلبي",
  // note drops the "؟ذكرنمائيد." the field ends with
  "آيا سابقه بيماري ديگري داريد؟ذكرنمائيد.": "توضیحات آيا سابقه بيماري ديگري داريد",
  // note adds "ساير يافته ها" the field does not have
  "راديوگرافي قفسه سينه": "توضیحات ساير يافته ها راديوگرافي قفسه سينه",
};

export const noteKeyFor = (
  field: keyof SBHM_Step2Record
): keyof SBHM_Step2Record | undefined => {
  const override = NOTE_OVERRIDES[field];
  if (override) return override;
  const candidate = `توضیحات ${field}` as keyof SBHM_Step2Record;
  return candidate;
};
