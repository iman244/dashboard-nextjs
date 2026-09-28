# Two sections: health record and monitorings

Decided with the user on 2026-09-28 through two review rounds. This supersedes the patient page spec's section list (`2026-09-28-patient-page-design.md`) where they differ.

## The model in the user's words

| User's term | Code today | Meaning |
|---|---|---|
| Campaign / monitoring (پایش) | `MonitoringType` | e.g. Step 1, Step 2, Blood pressure check |
| Excel upload | `SaderatBankHealthMonitoring` | One batch inside a campaign, e.g. "Mehr 1405" |
| Form record | `PatientEntry` | One patient's answers to a campaign's fields |

No database change is needed: uploads and form records already point at their `MonitoringType`.

## Sidebar

```
پرونده سلامت (Health record)
  جستجوی بیمار        /console/electronic-health-record
  گزارش دوره‌ای        /console/periodical-reports
پایش‌ها (Monitorings)
  فهرست پایش‌ها        /console/monitorings
  فرم آنلاین (فرم‌افزار) /console/form-sabt-payesh
  ثبت اطلاعات بیمار     /console/record-monitoring          staff
  بارگذاری اکسل پایش    /console/monitorings/upload          staff
  تعریف پایش جدید       /console/monitorings/new             staff
```

- Console home keeps rendering the same list, grouped the same way.
- The "Excel reports" section and the patient-reports page leave the product.
- Staff items are hidden from non-staff users, and their routes keep the `StaffOnly` guard.

## Pages

**Patient page** (`/console/patients/[national_id]`, the user's "patient-ehr-page"). Already built; it changes as follows:
- **EHR tabs per «نوع بیمار».** On open, all eight types are requested in the background for the date window. While any is loading, the tab bar shows a placeholder, so tabs do not pop in one by one. When all have settled, only types that returned rows get a tab, and a type that failed shows its error inside the EHR section. The lab tab shows lab series with the trend dialog. Every other tab shows that type's rows with the existing detail dialog. These tabs replace the "Service report by record type" card and the patient-reports page.
- **«پایش‌های این بیمار»** replaces the Excel reports card. It lists **campaigns**, not uploads: the union of campaigns with an Excel row for the person and campaigns with a form record. Each item links to the patient-in-campaign page.

- **EHR failures stay inside their section.** EHR requests on this page are marked so the global "Network error" dialog ignores them; an unreachable EHR service shows an inline error with a retry, and the monitoring sections below keep working.

**Patient search** (`جستجوی بیمار`) gains a national-ID box at the top: typing 8–10 digits (Persian or English) and pressing Enter opens `/console/patients/[national_id]` directly, with no date filters needed.

**Campaign list** (`/console/monitorings`, replaces the types admin table). One row per campaign: name, number of uploads, number of form records. The row opens the campaign page. Staff see "Define new campaign" and "Upload Excel" actions.

**Campaign page** (`/console/monitorings/[id]`, new):
- Header: the campaign name. Staff see "Edit definition" (→ `/[id]/edit`) and "Upload Excel" (→ `/upload?campaign=[id]`).
- Tab **Excel uploads**. An upload picker, newest first, with the latest selected by default; the selection lives in `?upload=`. Uploads are never combined.
  - A campaign with a chart layout (`step_1`, `step_2`) shows the selected upload's existing report: its charts, and the people sheet opened by clicking a bar.
  - Any other campaign shows the upload's rows as a searchable table. A row opens the patient-in-campaign page.
- Tab **Form records**. The existing records list, with staff add/edit/delete. `/console/monitorings/[id]/records` redirects here.
- The people sheet and the table link to the patient-in-campaign page instead of the per-upload person page.

**Patient in campaign** (`/console/monitorings/[id]/patients/[national_id]`, new; the user's "patient-detail-monitoring-page"):
- Header: name from the rows, national ID, the campaign, and a button to the patient page.
- For each upload in this campaign that has the person (newest first), the row is rendered by the campaign's layout: the step 1 or step 2 person sections, or a simple field list for other campaigns.
- Then the person's form record for this campaign, if any.
- **No EHR table.** That lives only on the patient page.

**Record entry** (`ثبت اطلاعات بیمار`): unchanged flow. `/console/record-monitoring` lists the campaigns that have form fields; picking one opens `/console/monitorings/[id]/records/new`. The form is built from the campaign's own fields, which already come from the server. Rendering on the server is not possible because the login token lives in the browser, and it is not needed.

**Upload** (`/console/monitorings/upload`, new page replacing the dialog): pick the campaign (preselected from `?campaign=`), a name, and the file. On success it goes to the campaign page with the new upload selected.

**Define / edit campaign**: the existing builder at `/new` and `/[id]/edit`, renamed in the UI. After a create it goes to the new campaign's page.

**Old addresses redirect**, so bookmarks keep working:
- `/console/saderat-bank-health-monitoring` → `/console/monitorings`
- `…/step-N/[id]` → `/console/monitorings/[typeId]?upload=[id]`
- `…/step-N/[id]/[nid]` → `/console/monitorings/[typeId]/patients/[nid]`
- `/console/patient-reports?nationalNumber=X…` → `/console/patients/X`

## Backend (Django)

**Permissions.** Any signed-in console user can **read**; only staff can **write**; patient accounts see only `patient-records/me/`.
- A new `IsConsoleReader` permission allows safe methods for an authenticated user without a `patient_identity`, and requires `IsClinicalStaff` for anything else.
- It applies to uploads (list, retrieve), monitoring types (list, retrieve), patient entries (list, retrieve), the patient-records lookup and person-reports.
- Tests:
  - a viewer can read each endpoint;
  - a viewer is refused every write;
  - a patient account is refused every one of these endpoints (it can still use `/me/`);
  - anonymous gets 401.

**Campaign counts.** The monitoring-types list and retrieve responses add read-only `upload_count` and `record_count`, annotated in one query, so the campaign list does not fetch every upload or record.

**Upload column check.** For a campaign with a chart layout (`step_1`, `step_2`), the upload endpoint checks that the spreadsheet has that layout's signature columns (its national-ID column plus a few columns only that layout's sheet has) before saving anything. Requiring every chart column would reject a valid sheet that lacks one optional lab test. A missing column fails with 400, and the error names each one, which the upload page shows. Campaigns without a layout accept any columns.

**Person reports** gains two things:
- Each item carries its campaign as `monitoring: {id, slug, name_en, name_fa}`.
- With `?monitoring=<id>`, each item also carries `rows`: only this person's rows from that upload, so the patient-in-campaign page never downloads whole uploads.

## Build order (thin slices, each usable on its own)

1. **Backend permissions, campaign counts, upload column check and person-reports additions**, with tests.
2. **Sidebar and campaign list**, the upload page, renamed define/edit, and "Excel reports" removed from the sidebar.
3. **Campaign page**: picker, existing charts, table fallback, form records tab, and redirects from the upload and records routes.
4. **Patient-in-campaign page**, «پایش‌های این بیمار» on the patient page, the person-page redirect, and the sheet/table links repointed.
5. **EHR tabs** on the patient page with the loading placeholder and inline EHR errors, the national-ID box on patient search, and removing the patient-reports page and its route (redirect).

## Known constraints

- The step 1 person view is one 1,265-line page. Slice 4 moves its rendering into a component unchanged (a mechanical move) so the patient-in-campaign page can reuse it; it is not rewritten.
- EHR data cannot be checked locally, because there is no upstream EHR address. EHR tabs need a check after deploy.

## Verification per slice

- Django tests on Postgres.
- Next.js: typecheck, no new lint errors in changed files, and the message check.
- A browser pass in fa and en, desktop and 390px, as staff, viewer and patient where the slice touches them.
