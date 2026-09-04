# Patient Portal — Design

Date: 2026-09-05
Branch: `feat/patient-portal`
Worktree: `/Users/iman244/Repositories/mainreport/dashboard-nextjs-patient-portal`

## Goal

Give a patient a way to see **their own** electronic health records without a
Django account and without the console. Two screens:

1. `/{locale}/patient/sign-in` — national ID as both username and password.
2. `/{locale}/patient/records` — the same table / detail-dialog experience as
   `/console/electronic-health-record`, scoped to that one national ID.

## Non-goals, stated plainly

**This is a UX gate, not a security boundary.** `_5_160_115_210_apiInstance`
(`src/lib/api/5.160.115.210/5apiInstance.ts`) is a bare axios instance with no
request interceptor — only the Django instance attaches a JWT.
`/EHRByNationalNumber` is therefore reachable from any browser,
unauthenticated, for any national ID, whether or not this feature exists. The
sign-in screen stops a casual visitor from browsing other people's records
through *this UI*; it does not protect the data. Anyone who opens devtools can
bypass it entirely.

That is a deliberate, accepted trade-off for this feature, not an oversight.
Making it real would require the records call to move behind Django with a
per-patient credential — out of scope here.

Also out of scope: Django changes, rate limiting, account recovery, audit
logging, and the phone-number lookup.

## Architecture

### Route layout

```
src/app/[locale]/(patient)/
  layout.tsx                    PatientSessionProvider, no guard
  provider.tsx                  session context + sessionStorage
  patient/
    sign-in/
      layout.tsx                reverse guard: session -> /patient/records
      page.tsx                  metadata + <Client/>
      client.tsx                the form
    records/
      layout.tsx                guard: no session -> /patient/sign-in
      page.tsx                  metadata + <Client/>
      client.tsx                header, filter, table, pagination, dialog
      provider.tsx              filters + EHR mutations, national ID from session
      _columns/index.tsx        patient column set
      _components/
        records-filter.tsx      date range + patient type only
        records-table.tsx
        records-table-pagination.tsx
        loading-skeleton.tsx
```

Two route-level layouts rather than one group-level guard, mirroring the split
that already exists between `(authenticated)/layout.tsx` (guards everything
below it) and `(auth-flow)/authentication/layout.tsx` (guards one route, in the
opposite direction).

Note: the route-classification helpers in `src/app/paths.ts`
(`isProtectedRoute`, `PROTECTED_ROUTES`, …) have **no call sites** — guarding in
this app is done by layout components. We add route constants to `AppRoutes` for
readability but do not extend the unused helper lists.

### Session

Mirrors `AuthenticationStatus` from `src/app/_auth/type.ts`:

```ts
enum PatientSessionStatus { Loading, Unauthenticated, Authenticated }

type PatientSessionContextType = {
  status: PatientSessionStatus;
  nationalId: string | null;
  signIn: (nationalId: string) => void;
  signOut: () => void;
};
```

Storage: `sessionStorage["patient_national_id"]`. Three states rather than a
boolean because the read can only happen after hydration — a boolean would flash
the sign-in screen on every refresh of `/patient/records`.

`signOut` clears storage and the react-query cache (`queryClient.clear()` plus
`getMutationCache().clear()`), matching `unauthenticateUser` in
`src/app/_auth/useJwtToken.ts`, so a second patient on the same device does not
see the first one's rows.

### Sign-in flow

Zod schema requires both fields and refines `username === password`, so a
mismatch fails client-side with no request sent.

On valid submit, one `ehr_by_national_number` mutation:

| param | value |
|---|---|
| `nationalNumber` | `digitsFaToEn(username)` |
| `fromDate` | `format(subYears(new Date(), 10), "yyyy/MM/dd")` (date-fns-jalali) |
| `toDate` | `format(new Date(), "yyyy/MM/dd")` |
| `patientType` | `"25"` |

`digitsFaToEn` is required: a Persian keyboard produces `۰۱۲` and the upstream
expects `012`.

Outcomes, kept distinct:

| outcome | UI |
|---|---|
| `data.length > 0` | `signIn(id)`, `router.push("/patient/records")` |
| `data.length === 0` | "no records found for this national ID" |
| mutation error | "could not reach the records service, try again" |

The empty-vs-error distinction matters and is currently collapsed in the console
provider; we do not repeat that.

### Records page

A **new lean provider**, not a reuse of
`(authenticated)/console/electronic-health-record/provider.tsx`. Reasons:

- That provider models `nationalNumber` as editable filter state. Here it must
  come from the session and must not be reachable from the UI.
- `useEHRColumns` calls `useElectronicHealthRecord()` internally and includes a
  row action that routes to `/console/patient-reports`, a route the patient
  cannot open.

Reusing either would mean threading an "am I a patient?" flag through console
code. Copying the thin presentational pieces is cheaper and keeps the console
untouched.

Patient provider state: `{ dateRange, patientType }`. National ID is read from
session and injected at call time. It fires one effect on filter change (the
console version duplicates the same mutation body in an effect *and* in
`callMutation` — here `callMutation` is the single source and the effect calls
it).

Landing defaults match the probe (10 years, type `25`) so the table is never
empty on arrival.

Filter UI: date range + patient type only, reusing the shared
`components/app/date-range-picker.tsx` and
`components/app/patient-type-selector.tsx`.

Columns: date, service name, doctor, place, patient type, actions (view details
only). Patient name and national ID columns are dropped — every row is the same
person, so they are pure noise here. Headers come from `t()`, not literals.

### Detail dialog

`EHRDetailModal` is shared. Change: make
`actions.mobileNumberByNationalNumber_m` **optional** in `EHRDetailModalProps`
and guard the mobile-number block (currently `EHRDetailModal.tsx:266-288`).

Optionality rather than a `showMobileNumber` boolean, because absence is the
signal: the patient page then never constructs an unused mutation, and
TypeScript enforces the guard instead of trusting a flag. The console call site
passes all three as before and is unchanged.

Lab and x-ray download buttons stay — they are the patient's own documents.

## i18n and RTL

Two new route-scoped namespaces, `/patient/sign-in` and `/patient/records`, in
both `messages/en.json` and `messages/fa.json`, kept at key parity. No literal
Persian in JSX. Logical CSS properties only (`ps-*`, `pe-*`, `ms-*`, `me-*`).
The copied `records-table.tsx` also replaces the hardcoded Persian error string
that `ehr-table.tsx` carries with a translated key.

## Error handling

- Sign-in: field errors from zod; API failure and empty-result rendered as two
  distinct messages below the form.
- Records: table renders loading / error / empty states, as `EHRTable` does.
- Guard: `/patient/records` without a session redirects to sign-in rather than
  rendering an error.

## Verification

- `npm run build` clean.
- `npx tsc --noEmit` — baseline is **0 errors** (after a build has generated
  `.next/types`; before that, `PageProps` errors are expected and unrelated).
- `npm run lint` held at exactly **33 errors / 48 warnings**, the pre-existing
  baseline on `main`. New files must contribute zero.
- Browser: `/fa/patient/sign-in` and `/en/patient/sign-in` at 390px and 1440px,
  both LTR and RTL. Unlike the console, these pages need no Django login, so the
  full flow is verifiable end to end.
