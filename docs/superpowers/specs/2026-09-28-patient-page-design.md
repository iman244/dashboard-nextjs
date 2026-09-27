# Patient page design

## Job and audience

Staff open one patient and read their full history on one page: EHR results with trends, reports, monitoring form records, and every Excel report row that mentions them. Today this is spread over EHR search, the patient-reports page, the records list of each monitoring type, and the per-upload Excel person pages. Decided with the user on 2026-09-28: approach A (a new page that replaces patient reports as the per-patient destination), full history, Excel rows searched automatically, default range the last 3 years and adjustable.

## Route and entry points

- `/[locale]/console/patients/[national_id]`, optional `?from=yyyy-mm-dd&to=yyyy-mm-dd` (Gregorian ISO in the URL; shown in Jalali). No range in the URL means the last 3 years up to today.
- The national ID is normalised (Persian digits to ASCII, 8–9 digits left-padded to 10). Anything else renders an "invalid national ID" state with a link back to Find a patient.
- Links to the page:
  - the EHR search row action (replaces "Patient report");
  - the periodical-reports service row;
  - the national ID cell on a monitoring's records list;
  - the header of both Excel person pages.
- The sidebar highlights **Find a patient** on this route (`activePrefixes: ["/console/patients"]`). Breadcrumb: Dashboard › Find a patient.
- "Patient reports" leaves the sidebar and console home. The route stays, with no redirect, and the patient page links to it as "Service report by record type". Its record-type selector covers types (hospital, orthopedic, drug, info) that this page does not load in v1, so removing it would lose data access.

## Page sections, top to bottom

1. **Header.**
   - Name: from the upstream `EHRGetMobileNumberByNationalNumber` lookup (`FirstName` `LastName`), else "Patient". `usePersonEhr` does not expose raw rows, and the person-reports endpoint does not return row contents.
   - National ID.
   - A `DateRangePicker` that writes `from`/`to` into the URL.
2. **EHR results.** `usePersonEhr`, extended to accept an explicit `{fromDate, toDate}`. The Excel person pages keep passing `campaignDate`. Rendered with `EhrRecordsTable`, `EhrTrendDialog` and `useRecordDetail`, the same as the step 2 person page. Types: lab, imaging, pathology, paraclinical.
3. **Monitoring records.** `PatientRecordsSection` with `authorized` for staff. Hidden for non-staff.
4. **Excel reports.** Staff only. One row per upload that contains the person: upload name, step label, upload date, and an "Open" link to the existing person page (`step-1/[id]/[nid]` or `step-2/[id]/[nid]`). Uploads of a type with no report view show the row without a link. An empty result gets its own short empty state.
5. **Service report link** to `/console/patient-reports?nationalNumber=…&fromDate=…&toDate=…`.

Each section loads and fails on its own. One failing source shows an inline error with retry and never blanks the page.

## Backend: person reports endpoint (Django)

- `GET /api/saderat-bank-health-monitoring/person-reports/?national_id=<id>`.
- Permission `IsClinicalStaff`, with the same throttle as `patient-records`. The ID is normalised with `normalize_national_id`. A malformed ID returns 400.
- Returns `[{id, name, type, created_at, match_count}]`, newest first.
- Matching looks in the step 1 key `personel.کد ملی` and the step 2 key `کد ملی`. Existing step 2 uploads stored this column as a number, so leading zeros are lost. The query therefore ORs `json__contains` over the 10-digit string, the string without leading zeros, and the integer. `match_count` is counted in Python over the candidate rows with the same normalisation.
- Upload parsing stores every national ID column as ten-digit text (`canonical_national_id`: numbers become text, 8–9 digits are padded), so new uploads keep leading zeros. Reading the column as text alone cannot restore zeros that Excel dropped from a number cell.
- The Excel person pages compare IDs by their padded form (`fullNationalId`, now shared from `lib/national-id`), so an upload with a numeric ID still opens.
- Tests (Postgres, since `json__contains` needs it):
  - staff only; patients and viewers get 403;
  - a malformed ID returns 400;
  - finds step 1 and step 2 uploads;
  - finds a legacy integer-stored step 2 ID;
  - does not match another person;
  - `match_count` counts duplicates;
  - a new upload keeps leading zeros.

## Out of scope for v1

- EHR types other than the four above.
- Showing Excel row contents inline (one click away on the person page).
- A "type a national ID" jump box.
- A GIN index on `json`: the upload table is small, so add one when it grows.

## Verification

- Django tests pass on Postgres.
- Next.js: typecheck, changed-file lint without new errors, and the message check.
- In the browser with the local seed: the page in fa/en and at 390px; a staff user sees monitoring records and Excel rows; a viewer sees neither; an invalid ID shows its state; the range change updates the URL; every entry point links correctly.
- EHR sections cannot be verified locally (no upstream address) and must be checked after deploy.
