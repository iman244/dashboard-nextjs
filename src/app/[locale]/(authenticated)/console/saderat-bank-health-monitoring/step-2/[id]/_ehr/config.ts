import { PatientType } from "@/components/app/patient-type-selector";
import type { SBHM_Step2Record } from "@/data/saderat-bank-health-monitoring/types";

/**
 * Which EHR branches this page pulls.
 *
 * LAB carries the numbers step_2 has none of; the other three carry the
 * reports behind step_2's imaging, pathology and ECG verdicts. One request
 * each — the page is a single person, so there is no fan-out to worry about.
 */
export const EHR_LAB_TYPE = PatientType.LAB;

export const EHR_REPORT_TYPES = [
  PatientType.IMAGE,
  PatientType.PATHOLOGY,
  PatientType.PARACLINICAL,
] as const;

/**
 * step_2 verdict field → the EHR services that evidence it.
 *
 * The excel column names are exact (they are typed against SBHM_Step2Record),
 * but the `match` patterns are matched against `نام خدمت`, whose vocabulary
 * comes from a different system and could not be sampled while this was
 * written — the EHR host is unset in local env. Each pattern is deliberately
 * broad and spelling-tolerant (Persian ی/ي and ک/ك both spellings accepted).
 *
 * A pattern that matches nothing renders nothing, so a wrong guess is
 * invisible rather than misleading. Correct them here as real service names
 * are observed; nothing else needs to change.
 */
export type EvidenceLink = {
  field: keyof SBHM_Step2Record;
  match: RegExp;
};

export const EVIDENCE_LINKS: EvidenceLink[] = [
  {
    // no bare base field exists; the ECG verdict lives on the note key
    field: "توضیحات تفسير الكتروكارديوگرام",
    match: /ecg|ekg|الكتروكارديوگرام|الکتروکاردیوگرام|نوار\s*قلب/i,
  },
  {
    field: "راديوگرافي قفسه سينه",
    match: /cxr|chest.*(x.?ray|radiograph)|راديوگرافي|رادیوگرافی|قفسه\s*سينه|قفسه\s*سینه/i,
  },
  {
    field: "سونوگرافي شكم و لگن",
    match: /sono|ultrasound|سونوگراف|سونگراف/i,
  },
  {
    field: "نتيجه ماموگرافي*",
    match: /mammog|ماموگراف/i,
  },
  {
    // likewise an orphan note — there is no bare pap smear field
    field: "توضیحات نتيجه نمونه پاپ اسمير*",
    match: /pap\s*smear|پاپ\s*اسمير|پاپ\s*اسمیر/i,
  },
];

/**
 * How far back to ask for history.
 *
 * step-1 hardcodes `1403/01/01`, which silently truncates anyone screened
 * outside that window. This is measured from the campaign date instead, so the
 * range moves with the data.
 */
export const EHR_HISTORY_YEARS = 3;
