import { format, subYears } from "date-fns-jalali";
import { digitsFaToEn } from "@persian-tools/persian-tools";
import { PatientType } from "@/components/app/patient-type-selector";

/**
 * How far back both the sign-in probe and the records page look by default.
 * Deliberately generous: the probe is what decides whether a patient can get
 * in at all, so a narrow window would lock out anyone whose last visit was a
 * while ago.
 */
export const PATIENT_LOOKBACK_YEARS = 10;

export const PATIENT_DEFAULT_PATIENT_TYPE: string = PatientType.PARACLINICAL;

/** The upstream expects Jalali dates, which is why this is date-fns-jalali. */
export const toJalali = (date: Date) => format(date, "yyyy/MM/dd");

export const defaultDateRange = () => {
  const now = new Date();
  return { from: subYears(now, PATIENT_LOOKBACK_YEARS), to: now };
};

/**
 * Params for the sign-in probe. A Persian keyboard produces ۰۱۲ and the
 * upstream wants 012, so every national id crossing the network goes through
 * digitsFaToEn first.
 */
export const signInProbeParams = (nationalId: string) => {
  const { from, to } = defaultDateRange();
  return {
    nationalNumber: digitsFaToEn(nationalId),
    fromDate: toJalali(from),
    toDate: toJalali(to),
    patientType: PATIENT_DEFAULT_PATIENT_TYPE,
  };
};
