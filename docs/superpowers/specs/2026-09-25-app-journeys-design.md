# App journeys and patient access design

## Job and audience

The Next.js app serves two audiences. Staff find a patient, inspect EHR and monitoring information, record structured monitoring entries, and review uploaded reports. Patients sign in to see only their own records. The console is an operational surface; the public home must make the two audience paths clear.

## Current map and failure points

```text
Public home
├─ Staff sign-in → console → EHR | periodical reports | patient reports | Bank reports | monitoring types | external form
└─ Patient sign-in (national ID used as password) → patient records

Console monitoring types → type → patient entries → new/edit entry
EHR row overflow menu → patient report
Bank report upload → any monitoring type → only step_1/step_2 have detail routes
```

The flat console list mixes tasks, reports, administration, and an external form. The active state disappears in nested routes. Entry creation requires discovering the administrative type list. The patient portal uses a client-side national-ID check and a credentialless EHR probe; the Django patient-records API accepts anonymous national-ID lookups. The upstream EHR API is also reachable directly without identity checks.

## Target map and journeys

```text
Public home
├─ Staff console → Find a patient [primary]
│  ├─ EHR search → EHR detail → patient report
│  ├─ Record monitoring → choose a type → entries → new/edit entry
│  ├─ Review reports → periodical reports | Bank monitoring reports
│  ├─ Administration (staff) → monitoring types → create/edit schema
│  └─ Online monitoring form (external FormAfzar embed)
└─ Patient records → Django credential sign-in → own monitoring records
   └─ EHR/laboratory/X-ray only after an authenticated backend proxy and upstream network restriction
```

Existing URLs and records remain valid. `/console/record-monitoring` is a new task entry. The console link to the FormAfzar embed uses `/console/form-sabt-payesh`; the public embed remains available. Staff patient reports remain reachable from EHR and direct links. A patient receives no general staff API permissions.

## Interaction and states

- The console home and sidebar share one ordered task map. The primary action is Find a patient. Sections separate finding, reviewing, recording, and administration. Nested routes highlight the owning task; `/console/monitorings/[id]/records...` belongs to Record monitoring.
- The monitoring chooser lists types with localized names and schema capability, and handles loading, empty, error, and no field schema. Django now restricts monitoring records and Bank reports to staff; the console hides these destinations from other accounts and guards direct routes.
- EHR results show a visible patient-report action. Page headers and breadcrumbs give a path back to the console and parent task. Filter removal is a keyboard reachable button. Persian and English catalogs contain all new interface copy.
- Excel upload offers only type slugs with a report detail renderer (`step_1`, `step_2`). Existing reports with other slugs remain visible with a clear unavailable-detail explanation.
- Patient sign-in uses a separately stored patient JWT obtained from Django. A linked patient profile supplies the national ID for `/patient-records/me/`. A patient cannot supply another national ID to that endpoint. Old national-ID-only browser sessions cease to authenticate.
- The patient portal must not make direct credentialless upstream EHR calls after sign-in. Until an authenticated Django proxy and an upstream network restriction are deployed, its own monitoring records are the patient-facing data surface. Staff EHR behavior is outside this patient access change.

## Authorization and deployment

Add a unique normalized `PatientIdentity` to Django users. Provision patient accounts through an operator-only command with generated passwords and an offline delivery process; never use a national ID as a password. Keep arbitrary national-ID lookup and general monitoring endpoints staff-only. Deny anonymous and unprofiled accounts. Restrict public user creation or ensure it cannot grant a patient identity. Release Django authorization and migration before the new Next.js patient client, then provision accounts and replace old sessions. Restrict production CORS to explicit origins; host restrictions should use configured domains.

The direct upstream EHR service remains an external security boundary. A Django proxy alone cannot stop someone from calling that upstream directly. The service owner must restrict it to the proxy before patient EHR data can be restored safely.

## Constraints and evidence

Preserve the existing visual language and components, Persian-first copy with English parity, RTL layout, locale routing, and Next.js 16 patterns. The source audit is in `.impeccable/critique/2026-09-25T11-43-59Z__xtjs-src-app-locale-authenticated-console-f0780988.md`; the generated graph is in the original Next.js checkout's `graphify-out/`. Its clusters are code relationships, not proposed navigation groups. Validate staff and patient permissions in Django tests and Next.js with typecheck, lint, build, and focused manual route checks.
