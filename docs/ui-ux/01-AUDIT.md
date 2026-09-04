# UI/UX Audit — Findings

Phase 1 output. See [00-CHARTER.md](00-CHARTER.md) for scope and constraints.

**Method:** Impeccable `critique`, dual-agent — Assessment A (design review, source-only,
deliberately blind to detector output) and Assessment B (deterministic detector +
RTL/i18n scans + browser evidence) run isolated and in parallel, then synthesized.

**Target:** `src/app/[locale]/(authenticated)/console` · **Mode:** Operate
**Date:** 2026-09-04 · **Base:** `main` @ ab4d68d

**Design Health Score: 16/40 (Poor)** — all 10 Nielsen heuristics applicable, none `n/a`.

Findings marked ✅ were independently verified in source by the orchestrator, not
taken on an agent's word.

---

## Priority split (user ruling, 2026-09-04)

**Persian is the priority. English is the second concern.** `en` is not dropped, but
English-only defects wait. Note the distinction that is easy to get wrong: **RTL work is
Persian-facing**, so it stays in Wave 1 despite looking like an i18n concern.

| Wave | Findings | Rationale |
|---|---|---|
| **1 — Now** | UX-02, UX-03, UX-04, UX-05, UX-06, UX-07, UX-08, UX-09, UX-10, UX-11, UX-12 | Affects Persian users directly, or is locale-independent |
| **2 — Later** | UX-01 | English-only: Jalali dates in `/en`, unconditional Persian numerals, hardcoded EHR headers |

Parts of UX-12 are Persian-facing (Zod messages hardcoded in English are shown to Persian
users; the unreachable empty state; the skeleton column mismatch) and stay in Wave 1.

---

## Severity key

| Tag | Meaning |
|---|---|
| P0 | Blocks the core task or risks real harm (wrong patient data, wrong dates in a bank report) |
| P1 | Major friction or a visibly broken surface |
| P2 | Notable correctness/accessibility debt |
| P3 | Polish |

---

## Findings

### UX-01 · P0 · The `en` locale build is unusable — **DEFERRED to Wave 2**
Three compounding failures:
- ✅ `src/lib/utils.ts:3` imports `format` from **`date-fns-jalali`**; line 29 uses it for
  the `en` branch too. English users read Jalali dates as if Gregorian.
- 84 unconditional `digitsEnToFa()` calls across 12 files put Persian numerals on every
  chart axis and tooltip regardless of locale.
- The entire EHR table (8 headers, action labels, screen-reader text, error state) is
  hardcoded Persian in `_columns/index.tsx` and `ehr-table.tsx`.

159 hardcoded user-facing Persian strings across the console, against 229 correctly
maintained translation keys.

**Why it matters:** in a banking context an English-reading auditor misreading a Jalali
date as Gregorian is a material error, not cosmetic.

**Fix:** split `formatDate` into `formatJalali`/`formatGregorian`; replace bare
`digitsEnToFa(x)` with the existing `localeDigits(x, locale)` (same file, already
imported in most call sites); move EHR headers into the
`/console/electronic-health-record` namespace.

---

### UX-02 · ~~P0~~ · No national-ID validation — **DROPPED by user, 2026-09-04. Do not reopen.**

> Ruled out of the UI/UX pass. A hard checksum could block lookups for IDs already
> present in the database (legacy imports, test data, non-standard formats), and the
> frontend cannot verify that. Note also that the severity below overstates the risk:
> the caller is already authenticated and authorized, so this is a data-*accuracy*
> problem (reading the wrong patient), not a data-leak one.

`patient-reports/_form/patient-reports-form.tsx:36` validates as
`z.string().min(1)`. `electronic-health-record/_components/ehr-filter.tsx:52` has no
format constraint. `@persian-tools/persian-tools` — already a dependency, already
imported in both files — exports `verifyIranianNationalId`. Zero length or checksum
checks anywhere in `src/`.

**Why it matters:** one transposed digit passes validation and returns either an empty
report ("this patient has no records") or **another real person's data**.

**Fix:** `z.string().length(10).refine(verifyIranianNationalId, …)` in both schemas,
normalizing through `digitsFaToEn` *before* validation. Add the message to both catalogues.

---

### UX-03 · P1 · Five chart series render with invalid CSS and no legend
✅ Verified. Five call sites use `fill="hsl(var(--chart-N))"` while `globals.css:85-89`
defines those tokens as `oklch()`. `hsl(oklch(...))` is invalid CSS and resolves to nothing.

| File | Line |
|---|---|
| `periodical-reports/_charts/record-count-chart.tsx` | 30 |
| `periodical-reports/_charts/patient-count-chart.tsx` | 30 |
| `patient-reports/_charts/service-count-chart.tsx` | 27 |
| `saderat-bank-health-monitoring/[id]/page.tsx` | 911, 1451 |

✅ Separately, `[id]/page.tsx:250` sets the gender pie palette to
`["black","gray","brown","red","orange"]` — raw keywords that ignore the theme, are
near-invisible on the dark background, and collapse to one hue under deuteranopia.

No chart in the console renders a `<Legend>`.

**Fix:** use bare `var(--chart-N)` (already correct at `[id]/page.tsx:449,497,541`);
replace `COLORS` with the five chart tokens; add `ChartLegendContent` to the pie and any
multi-series chart.

---

### UX-04 · P1 · Both write operations fail silently
- `_delete-excel-dialog/dialog.tsx:32-41` passes only `onSuccess` — **no `onError`**. A
  failed delete of an entire dataset produces no toast, no message, no state change.
- `_upload-excel-dialog/dialog.tsx:66-82` surfaces only errors whose key matches a form
  field; 500s, timeouts, malformed-sheet and permission errors are `console.log`'d and
  discarded, with the dialog left open and the button re-enabled.

**Why it matters:** these are the only two write operations in the product. Silence reads
as "nothing happened," so users retry — and the API has no visible idempotency guard.

**Fix:** add `onError` to the destroy mutation; add an `else` branch surfacing unmatched
upload errors as a persistent inline `Alert` inside the dialog. Use `AlertDialog` (already
at `src/components/ui/alert-dialog.tsx`) for the delete, with dataset name and record count
in the confirmation body.

---

### UX-05 · P2 · RTL is hardcoded rather than logical
Deterministic count across `src/`: **75 physical vs 8 logical direction classes (90.4%
physical)**. `me-`, `ps-`, `pe-`, `text-end`, `border-e` are all at **zero**.

Per family: `ml-` 10 · `mr-` 4 · `pl-` 7 · `pr-` 10 · `left-` 11 · `right-` 12 ·
`text-left` 5 · `text-right` 7 · `border-l*` 4 · `border-r` 2 · `rounded-l*` 1 ·
`rounded-r*` 2. Plus 14 `space-x-reverse` uses in the pagination components.

Top offenders are all shared, so each fix propagates: `components/ui/sidebar.tsx` (17),
`ui/dropdown-menu.tsx` (11), `EHRDetailModal.tsx` (7), `ui/sheet.tsx` (5),
`ui/button-group.tsx` (4).

✅ **`src/app/layout.tsx:39` emits `<html suppressHydrationWarning>` with no `lang` and no
`dir`.** Confirmed at runtime on `/fa`: `htmlDir: null, htmlLang: null,
computedDir: "ltr"`. Direction comes only from a CSS class on `<body>` plus ~13 scattered
per-component `dir={dir}` props, each re-deriving `locale === "fa"` independently.
This is a **WCAG 3.1.1 failure at the document root**.

Also: pagination chevrons are direction-locked, so in `/en` "first page" points right and
"next page" points left. `ehr-filter.tsx:120` pins `dir="rtl"` in *every* locale.
`tailwindcss-rtl` is in `package.json` but inert (Tailwind v4, no config file).

**Fix:** `space-x-* + space-x-reverse` → `gap-*`; `ml-`/`mr-` → `ms-`/`me-`;
`text-left`/`text-right` → `text-start`/`text-end`; `right-3`/`pr-10` → `end-3`/`pe-10`.
Add `lang={locale} dir={dir}` to `<html>`. Drop `tailwindcss-rtl`.

---

### UX-06 · P1 · The patient record buries the abnormal results
`[national_id]/page.tsx:68-78` — `getStatusColor` already classifies every value as
normal/high/low. That signal drives **only a badge tint**; it never sorts, filters, or
summarizes. ~50 status tiles render in flat grids with no severity ordering, so an
abnormal HbA1C sits between 26 normals with identical visual weight.

`getStatusColor:76` maps *low* to `destructive` — the same red as *high*. Clinically
opposite findings, visually one alarm.

`:514-595` — the lab trend charts, the only thing answering "is this getting worse?", are
commented out in source.

**Why it matters:** a physician's question is never "show me 27 values," it is "what is
wrong with this person." The classification logic already exists; only the composition is
missing. **Highest value-per-effort fix in the audit.**

---

### UX-07 · P2 · The console has no front door
✅ `console/client.tsx` returns `<div></div>`. Users land on an empty rectangle beside a
sidebar — no orientation, no recent reports, no jump-to-national-ID.

Compounding: EHR defaults to `today → today` (`electronic-health-record/provider.tsx:79-82`),
which for most users returns zero rows — so the first impression of the flagship table is
an empty state that looks like a failure, with no copy explaining the range is why.
Periodical reports defaults `dateRange: null`, requiring a form fill before anything shows.

---

### UX-08 · P2 · Accessibility gaps in the console tree
- Zero `aria-label` anywhere in the console. Every icon-only button announces as "button"
  (view/delete in the datasets table, the record link in the personnel sheet, the dialog
  close, the chart trigger).
- Chart tick labels are hardcoded `fontSize={12}` px — they do not scale with browser text
  zoom.
- `[id]/page.tsx:485-488` uses `angle={45} textAnchor="end"` on rotated Persian ticks,
  which mis-anchors in RTL.
- No theme toggle and no language switcher exist inside the authenticated app at all;
  `DarkModeToggle` lives only in `(public)/_components/`.

---

### UX-09 · P2 · Consistency debt across duplicated components
Three near-duplicate pagination components (`ehr-table-pagination.tsx`,
`[id]/table-pagination.tsx`, `components/app/table-pagination.tsx`); two table shells
(`ehr-table.tsx` vs `components/app/data-table.tsx`); `ServiceCountTable` implemented twice
verbatim; three colliding dictionary namespaces (`common.data`, `common.dictionary`,
`common.Dictionary`). `console/layout.tsx` provides no header slot, so each route
re-invents its own (`h1` vs `h2`, some none).

---

### UX-10 · P2 · Filter select is uncontrolled, so Clear lies
✅ `components/app/patient-type-selector.tsx:77` uses `defaultValue={field.value}` on a
Radix `Select`, making the trigger uncontrolled. `ehr-filter.tsx:106` calls
`reset(clearedFilters)`, which resets form state — but the visible trigger keeps showing
the previous selection. The user clicks Clear, still sees the old patient type, and
submits believing a filter is applied that is not.

**Fix:** `value={field.value}`.

---

### UX-11 · P3 · fa-only copy defect that key-parity cannot catch
✅ `messages/fa.json:139` and `:143` set both the **username and password** placeholder to
`"ورود به حساب کاربری"` ("Sign in to your account") — a copy-paste of the card subtitle.
English is correct. Both keys exist, so the 229-key parity check passes; only the values
are wrong.

---

### UX-12 · P3 · Assorted
- Sidebar's "فرم ثبت پایش" points at the **public** route, dropping users out of the
  console shell. The console's own `form-sabt-payesh/page.tsx` is byte-identical and never
  linked.
- The designed empty state on the monitoring list is **unreachable** — it guards on
  `data === undefined`, but `isPending` always wins that branch first. Should guard
  `data.length === 0`.
- Zod validation messages are hardcoded English, rendered to Persian users.
- Loading skeleton renders 7 cells against an 8-column table — the table snaps sideways
  when data arrives. Drive it from `columns.length`.
- 14 `console.log` calls ship to production; two log patient data.
- `[id]/page.tsx:46-200` computes ~60 distributions per render and displays 25.
- `sheet.tsx` uses `t("Key") || "fallback"` — dead code, since next-intl never returns a
  falsy value; it would mask a real miss.
- `src/app/layout.tsx` and `[locale]/layout.tsx` both register Geist/Geist_Mono/Vazirmatn;
  the latter's copies are unused.

---

## Follow-ups found during execution (not in Wave 1)

Discovered while fixing other things. Each was deliberately left alone rather than
silently widening a task's diff.

- **UX-13 · Hardcoded English Zod messages in the auth flow** — ✅ **FIXED** (`9fcf3ae`).
  `(auth-flow)/authentication/client.tsx` showed `"Username is required"` /
  `"Password is required"` to Persian users on the first screen every user sees. Now
  built from a `makeLoginSchema(t)` factory. **Verified in a real browser** — the only
  change in this whole pass that was.
- **UX-17 · Disabled signup feature was still being carried** — ✅ **REMOVED** (`647033e`).
  The route was already dead (`_page.tsx`, entry point commented out), but three files,
  hardcoded English Zod messages, and 15 message keys per locale remained. Deleted rather
  than translated. Recoverable from git history if signup is re-enabled.
- **UX-14 · Latent RTL anchor bug on three more chart axes.** `text-anchor` in SVG
  resolves against inline-base direction, so `textAnchor="end"` anchors the *left* edge
  of a Persian string now that `<html dir="rtl">` is set (Task 1). Task 10 fixed the two
  worst axes; three `angle={-45}`/`angle={-90}` axes elsewhere carry the same latent
  issue, currently less visible.
- **UX-15 · `title="Toggle Sidebar"`** hardcoded English in `components/ui/sidebar.tsx`.
  Not an accessibility defect (it has an `aria-label`), so it belongs to UX-01 / Wave 2.
- **UX-16 · Commented-out lab trend charts** in `[national_id]/page.tsx` still carry dead
  `tick={{ fontSize: 12 }}` and dead `chartData` computation. Either restore the charts
  (they answer "is this getting worse?", the one comparative view on the record) or
  delete the block.

---

## Method notes worth keeping

- **The deterministic detector found 0 findings across all 138 source files.** Assessment B
  did not report that at face value — it wrote a control file with known anti-patterns,
  confirmed the detector fires (exit 2), and confirmed no config suppressed output. The
  zero is real, and it is weak evidence: the detector has **no RTL or logical-property
  rule**, so it missed everything in UX-05.
- **Browser evidence covered public routes only.** `/fa/console` 302s to the auth page, so
  no authenticated screenshots were possible. On the public pages RTL renders *correctly* —
  theme toggle mirrors, cards reverse, chevrons flip, no overflow at 1440 or 390. But those
  pages are hero-and-cards layouts; the 75 physical classes live in `components/ui`
  (sidebar, dropdown, sheet, pagination) which render **only behind auth**. The clean RTL
  that is observable exercises almost none of the risky code.
- To get authenticated coverage, the Django backend and a test login are required.
