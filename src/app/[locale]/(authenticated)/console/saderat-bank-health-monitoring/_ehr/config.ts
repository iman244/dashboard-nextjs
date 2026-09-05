import { PatientType } from "@/components/app/patient-type-selector";

/**
 * Which EHR branches this page pulls.
 *
 * LAB carries the numbers step_2 has none of; the other three carry the
 * imaging, pathology and paraclinical reports. One request each — the page is
 * a single person, so there is no fan-out to worry about.
 */
export const EHR_LAB_TYPE = PatientType.LAB;

export const EHR_REPORT_TYPES = [
  PatientType.IMAGE,
  PatientType.PATHOLOGY,
  PatientType.PARACLINICAL,
] as const;

/**
 * How far back to ask for history.
 *
 * step-1 hardcodes `1403/01/01`, which silently truncates anyone screened
 * outside that window. This is measured from the campaign date instead, so the
 * range moves with the data.
 */
export const EHR_HISTORY_YEARS = 3;

/**
 * Deliberately absent: a map from step_2 excel columns to EHR services.
 *
 * Pairing a verdict with the report behind it would be the most useful thing
 * this page could do, but it cannot be done from the types. `نام خدمت` is
 * typed as `string`; its vocabulary lives in the other system's data, and
 * matching it would mean pattern-guessing service names — silently mispairing
 * a finding with the wrong report when a guess is close but wrong.
 *
 * Reports are therefore listed on their own, attributed only to the date and
 * service name they arrive with. Building the pairing needs a real sample of
 * `نام خدمت` values, or better, a shared service code both systems agree on
 * (`كد خدمت` is already on the EHR row and has no step_2 counterpart).
 */
