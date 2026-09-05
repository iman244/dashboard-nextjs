# Visual Design Roadmap — Wave 2

> **Read this first** when resuming visual/theme work. It is the single source of truth
> for what we intend to change, in what order, and why. Companion to
> [00-CHARTER.md](00-CHARTER.md) (constraints) and [01-AUDIT.md](01-AUDIT.md) (Wave 1).

**Branch:** `feat/visual-design` · **Base:** `main` @ 3586cab · **Started:** 2026-09-04

**Goal:** make the console genuinely good-looking, without changing what any screen does
or which data it shows.

---

## The diagnosis in one line

**The entire theme is a single hue.** Every token — `primary`, `secondary`, `muted`,
`accent`, `border`, `ring`, all six `sidebar-*`, and all five `chart-*` — is a sky blue
between hue 205 and 255. Nothing can stand out, because everything is the same colour.

Two consequences, one aesthetic and one functional:

- **Aesthetic:** the interface reads flat and unconsidered. There is no hierarchy of
  emphasis, because emphasis requires contrast the palette cannot provide.
- **Functional:** categorical charts (gender, insurance, BMI bands) render as five shades
  of one blue, which is close to unreadable — worst in the pie, where adjacent slices
  differ only in lightness.

Secondary finding: **light and dark are not the same product.** Light is built on hue ~230
(sky); dark is built on hue ~264 (indigo/violet). The theme shifts family when you toggle.

---

## Design direction (chosen 2026-09-04 — no brand palette exists, so this is ours)

Recorded here so it does not get re-litigated or drift.

1. **Neutral spine, coloured data.** Chrome (surfaces, borders, text, sidebar) moves to a
   near-neutral cool grey. Colour becomes meaningful rather than ambient — when everything
   is blue, blue means nothing. This is the single change that makes the data legible *and*
   the UI look considered.
2. **One brand hue, used sparingly.** A deep blue stays as `primary` for actions and
   identity — appropriate for both clinical and banking contexts, and familiar to existing
   users. It should appear on maybe 5% of any given screen.
3. **A real semantic set.** Today only `destructive` exists, which is why Wave 1 had to
   render clinically opposite findings (low vs high) in the same red. We need
   `success` / `warning` / `danger` / `info` as first-class tokens.
4. **Three separate chart scales, chosen by data shape** — this is the part most dashboards
   get wrong:
   - **Categorical** (gender, insurance, service type) — 6–8 distinguishable hues.
   - **Sequential** (age bands, record counts) — one hue, light→dark. Ordered data must
     not get categorical colours; it implies the categories are unrelated.
   - **Diverging** (lab results) — the key insight: `low ← normal → high` is *textbook*
     diverging data. A cool→neutral→warm ramp encodes direction and magnitude at once,
     and solves the "low and high look identical" problem at the token level rather than
     with an icon patch.
5. **Accessible by construction.** Every pair checked for WCAG AA contrast, and the
   categorical scale checked under deuteranopia — not decided by eye.
6. **Dark mode is designed, not derived.** Same hue family, re-tuned lightness, never a
   mechanical inversion.

---

## Work items

Ordered by dependency. Each has an ID so we can refer to it without re-explaining.

### Phase A — Token foundation (everything else inherits this)

| ID | Item | Why |
|---|---|---|
| **VIS-01** | Rebuild the colour token layer: neutral ramp, one brand hue, full semantic set | The root cause. Nothing downstream can look right until this does. |
| **VIS-02** | Bring light and dark into the same hue family, re-tuned rather than inverted | They are currently different products. |
| **VIS-03** | Three chart scales — categorical, sequential, diverging — as tokens | Charts are most of the visual surface. |
| **VIS-04** | Contrast + colour-blindness validation, recorded in the repo | So the palette is defensible, not just pretty. |

### Phase B — Typography

| ID | Item | Why |
|---|---|---|
| **VIS-05** | A real type scale, applied consistently | Verified: routes use 1 `h1`, 3 `h2`, 6 `h3` with no shared system — each page invents its own hierarchy. |
| **VIS-06** | Persian typography tuning: line-height, letter-spacing, optical size for Vazirmatn | Persian needs more leading than Latin at the same size. Currently untuned. |
| **VIS-07** | `tabular-nums` on every numeric column, stat tile, and axis | Verified: used in exactly 2 shadcn primitives and **nowhere** in the data tables — so columns of numbers cannot be compared vertically, in a product whose whole job is comparing numbers. |
| **VIS-08** | Harmonise Vazirmatn and Geist optical sizes | The two scripts currently render at visibly different weights at the same size. |

### Phase C — Layout and rhythm

| ID | Item | Why |
|---|---|---|
| **VIS-09** | A page shell with a real header slot — title, breadcrumb, actions | Verified: `console/layout.tsx` renders a bare `SidebarTrigger` and `{children}`. Every route re-invents its own header, which is why heading levels disagree. |
| **VIS-10** | Spacing scale and consistent card density | |
| **VIS-11** | Break the 25-chart wall into grouped panels (metabolic / hepatic / renal / haematologic) | Carried from audit UX-08. The single densest screen in the product. |
| **VIS-12** | Elevation and shadow system | Currently flat borders everywhere; no depth vocabulary. |

### Phase D — Component polish

| ID | Item | Why |
|---|---|---|
| **VIS-13** | Status/badge vocabulary built on the new semantic tokens | Replaces the Wave 1 icon patch with a real system. |
| **VIS-14** | Table polish: density, row hover, sticky headers, numeric alignment | The tables are where users spend their time. |
| **VIS-15** | Focus and hover states across interactive elements | Keyboard users currently get shadcn defaults on a palette that barely shows them. |
| **VIS-16** | Visual consistency across empty / loading / error states | Each is currently styled ad hoc. |

### Phase E — Charts

| ID | Item | Why |
|---|---|---|
| **VIS-17** | Apply the right scale per chart (see VIS-03) | Ordered data currently gets categorical colours. |
| **VIS-18** | Axis, gridline, and tooltip styling | |
| **VIS-19** | Reconsider the gender pie | Pies are poor for comparison; a small bar may serve better. Decide, don't default. |

### Deferred — not part of Wave 2

- **Motion / animation.** Won't fix flatness, and this is a dense data surface. Revisit
  only after the static design is right.
- **UX-01** (English locale) — still your Wave 2-of-i18n, separate track.
- **UX-07** (console front door renders `<div></div>`) — needs a product decision about
  what that screen shows. Worth doing, but it is a content question before a visual one.
- **UX-09** (three duplicate pagination components) — refactor, not visual.

---

## Constraints (inherited from the charter, still binding)

1. **Persian first.** Every change verified in `/fa`. RTL is a first-class layout mode.
2. **Logical CSS properties only** — `ms-`/`me-`, `ps-`/`pe-`, `start-`/`end-`. Wave 1
   removed all 75 physical ones; do not reintroduce any.
3. **No hardcoded user-facing strings.** New copy goes in both catalogues, at parity.
4. **`npm run build` and `npx tsc --noEmit` must pass.** Lint must stay at **33 errors /
   48 warnings** — the pre-existing baseline. Never let it grow.
5. **No behaviour changes.** This wave changes how things look, not what they do.

---

## Status (updated 2026-09-05)

| ID | Item | State |
|---|---|---|
| **VIS-01** | Colour token layer | ✅ Rebuilt from `ui-ux-pro-max` `colors.csv` row 182 |
| **VIS-02** | Light/dark same family | ✅ |
| **VIS-03** | Three chart scales | ✅ categorical / sequential / diverging |
| **VIS-04** | Contrast + CVD validation | ✅ `scripts/check-tokens.mjs`, exits non-zero |
| **VIS-05** | Type scale | 🟡 partial — `PageHeader` on Tailwind steps; no project-wide scale |
| **VIS-06** | Persian typography (leading, tracking) | ❌ not started |
| **VIS-07** | `tabular-nums` | ✅ on both table components |
| **VIS-08** | Vazirmatn / Geist optical harmony | ❌ not started |
| **VIS-09** | Page shell with header slot | ✅ `PageHeader` on all four routes, with breadcrumbs |
| **VIS-10** | Spacing scale, card density | 🟡 partial — done on sign-in and tables only |
| **VIS-11** | Break up the 24-chart wall into panels | ❌ **not started — biggest remaining item** |
| **VIS-12** | Elevation / shadow system | ❌ not started |
| **VIS-13** | Status badge vocabulary | ✅ on semantic tokens, no hardcoded colours left |
| **VIS-14** | Table polish | ✅ headers, hover, `overflow-x-auto`, `aria-busy` |
| **VIS-15** | Focus / hover states | 🟡 partial — verified on sign-in only |
| **VIS-16** | Empty / loading / error consistency | 🟡 partial |
| **VIS-17** | Right scale per chart | ✅ stopped cycling hues on 24 single-series charts |
| **VIS-18** | Axis, gridline, tooltip styling | ❌ not started |
| **VIS-19** | Reconsider the gender pie | ❌ not started |
| — | Theme toggle in console + sign-in (UX-08) | ✅ |
| — | Post-login transition (UX-18) | ✅ interstitial deleted; 3513ms → 542ms, measured |

**The gap that matters most: none of the console work has been seen in a browser.**
Every authenticated route is behind a Django login that has not been available, so
VIS-09, 13, 14, 17 are typechecked and built but visually unverified.

## Decisions log

- 2026-09-04 — No Saderat brand palette exists; user gave a free hand. Direction above is
  ours to own.
- 2026-09-04 — Motion deferred: it does not address the actual problem, which is that the
  palette has no contrast to work with.
- 2026-09-05 — **UX-18, the post-login transition.** `/impeccable critique` scored it 14/40;
  full report in `.impeccable/critique/2026-09-05T00-21-24Z__*.md`. The "you are authenticated"
  notice was deleted rather than restyled: it was a developer's redirect-fired confirmation
  left in the user's path, and the correct delay-free redirect already existed in
  `on-login.ts` but could never run — flipping `authStatus` unmounted the component that
  owned it. Measured after: click → `/console` **542ms** (was 3513ms), zero frames showing
  neither the sign-in card nor console chrome. Same treatment applied to the logout path.
  Two leaks closed alongside: `?next=` was an unvalidated open redirect (verified: a crafted
  link landed the browser on `example.com` after a real sign-in; now blocked, including the
  `//host` form), and `src/settings.ts` was dumping backend addresses and token keys to every
  visitor's console on every page load.
- 2026-09-05 — **Rebased onto `main` @ 44b7d83** (PRs #8 patient-portal, #9 report-tables,
  #5 sbhm-step-2, #10 patient-nav — 53 commits). Three conflicts, all trivially additive:
  both catalogues (kept both sides), `table.tsx` (kept our logical `pe-0` over main's
  `pr-0`), `settings.ts` (kept main's `PATIENT_SESSION_KEY`, dropped the console dump).
  Git followed the `[id]/` → `step-1/[id]/` rename on its own, so the PageHeader work
  landed on the renamed file.
- 2026-09-05 — **Aligned main's new surfaces to this wave.** Audited them first: **zero**
  physical CSS properties and **zero** hardcoded colours in the new work, so the palette and
  the logical-property rule were already respected. What was not:
  - Two sign-in screens in one product, one designed and one a stock shadcn card. Extracted
    `components/app/auth-shell.tsx` (`AuthShell` + `AuthSubmitButton`) and put **both**
    through it, rather than copying the staff card into the patient one. Measured after:
    identical tray radius (32px), card radius (26px), 7 shadow layers, 48px pill, orbs,
    theme toggle, live-region count, card box — at 1440 and 390.
  - `saderat-bank-health-monitoring/page.tsx` had no heading on **any** state, and the
    upload action only existed on the populated table. One `PageHeader` now wraps all four.
  - `step-2/[id]/page.tsx` titled itself with a bare `h2` and put sections at `h3` — no `h1`
    on the page and a skipped level. Now `PageHeader` + `h2` sections, matching step-1.
  - `(patient)/patient/records/client.tsx` hand-rolled an `h1`+`p` at different values.
    Now `PageHeader`; `min-h-screen` → `min-h-dvh`; and the theme toggle moved into its
    action slot, because that route group has no sidebar and patients could not reach it.
  - `sidebar.tsx` `outline` variant used the stock `hsl(var(--sidebar-border))`, which is
    invalid against oklch tokens so the ring silently never painted. Latent (nothing passes
    that variant yet), fixed anyway.
- 2026-09-05 — **Applied the wave's own decisions to main's new work** (the alignment above
  was structural; this is the content).
  - `_ehr/status-icon.tsx` rendered `low` and `high` in the same `destructive` red — the
    exact defect Wave 1 had to patch with an icon, reintroduced. Its comment explained why:
    it was written when the palette was one sky hue plus `destructive`. VIS-01 changed that.
    Now the two ends of the diverging ramp (`chart-div-1` cool / `chart-div-5` warm) with
    `success` for in-range, which is what that ramp exists for.
  - Making those into *text* colours moved them from WCAG 1.4.11 (3:1, marks) to 1.4.3
    (4.5:1, running text), so `chart-div-1`, `chart-div-5`, `success` and `destructive`
    were added to `CONTRAST_PAIRS`. **The validator immediately failed**: dark
    `chart-div-5`/`destructive` (#EF4444) on the dark card measured **4.33:1**. Lifted both
    to `oklch(0.652 …)` / #F54A49 — the smallest bump that clears it (4.61:1). Note this was
    a **pre-existing** failure: `text-destructive` on a card in dark mode had always been
    below 4.5, it had simply never been checked against a surface, only against its own
    foreground. 37/37 pairs pass in both themes now.
  - `step-2/_charts/distribution-chart.tsx` cycled `--chart-1..5` across ~20 single-series
    bar charts — VIS-17's exact pattern, reintroduced. One hue (`--chart-1`) now, matching
    step-1; the `color` field is gone from the config. Axis ticks moved from `fontSize={12}`
    to `CHART_TICK_FONT_SIZE` so they scale with the browser's text setting (WCAG 1.4.4).
  - The SBHM index table wrapper was `overflow-hidden`, which does not merely omit
    horizontal scroll — it clips the far columns unreachably. Now `overflow-x-auto`, plus
    `tabular-nums` on its cells. The other two new tables already delegate to `DataTable`
    and needed nothing.
- 2026-09-05 — **Both deferred items closed.**
  - **`useDirection()`.** `locale === "fa"` was copied into 20 places across 14 files, and
    three had already drifted. Now `src/lib/direction.ts` (pure: `isRtlLocale`,
    `directionOf`, `fontClassOf` — no `"use client"`, so the root layout, the locale layout
    and the console layout can all call it) plus `src/lib/use-direction.ts` (`useDirection`,
    `useIsRtl`) for client components. `lib/utils.ts`'s four locale branches route through
    the same predicate, so a second RTL locale is one line. **Zero occurrences left.**
    The hook doc says to prefer logical CSS over branching, and to reach for it only where
    a *value* depends on direction — a Radix `side`, a mirrored icon.
  - **Locale-aware digits.** 88 direct `digitsEnToFa` calls rendered Persian numerals to
    English readers. Now `useLocaleDigits()`, a memoised formatter that drops straight into
    recharts' `tickFormatter`/`formatter`. **Zero direct calls left outside `lib/`.**
    Verified behind a stubbed login: `/fa` shows 4 Persian digits and 0 Latin, `/en` shows
    4 Latin and 0 Persian, no console errors in either.
  - Fixing the digits exposed that `date-range-picker.tsx` also hardcoded its five preset
    labels in Persian, so English read "از ابتدای سال 1404". Moved to `common.DateRangePicker`
    with `{year}`/`{month}` interpolation; its `useCallback` also had an empty dep list while
    closing over locale-bound values, which froze the labels at whichever locale rendered
    first. Jalali month and year names are kept in both locales on purpose — the calendar the
    control opens is Jalali, so a Gregorian label would name a different range than it selects.
  - Lint went **33 errors / 36 warnings → 33 / 32**: errors at baseline, four fewer warnings,
    because the refactor removed dead imports and bindings. One genuine bug was caught by
    `react-hooks/rules-of-hooks` on the way — the codemod put `useIsRtl()` into
    `(public)/page.tsx`, which is an async server component; it takes `isRtlLocale(locale)`.
- 2026-09-05 — ~~**Deliberately not fixed:**~~ *(closed above)* the new charts call `digitsEnToFa` unconditionally
  on axis ticks and tooltips, so English renders Persian digits. Our own charts do the same —
  it is a codebase-wide pattern, not a regression, and it belongs to UX-01 (English locale),
  which is a deferred track.
- 2026-09-05 — **Page metadata, localised.** Every title and description in the app was a
  hardcoded English literal, so a Persian tab read "Console" and the meta description just
  repeated the product name — and **12 of 18 routes had no metadata at all**. All 17
  reachable routes now resolve through `src/lib/metadata.ts` and the `metadata` namespace,
  in both locales, following next-intl's documented `generateMetadata` +
  `getTranslations({locale, …})` form (the locale is forwarded, which is what keeps the
  metadata statically renderable).
  - Nine pages are client components and cannot export metadata, so they take it from a
    sibling server layout — six of which are new and exist only for that.
  - The root layout owns the `%s | <product>` template. **Two attempts to get the
    inheritance right:** a layout's plain-string title becomes the new fallback for its
    children *without* carrying a template, so step-1, step-2 and the person pages silently
    lost the suffix; re-declaring the template with the suffix also baked into `default`
    then rendered it twice, because the parent template still applies to `default`. Hence
    two helpers: `pageMetadata` for leaves and `sectionMetadata` for a layout that has both
    a title and titled descendants.
  - `robots: { index: false, follow: false }` is declared once on the console and patient
    layouts and inherited by everything under them, plus on the two redirect interstitials,
    which were crawlable pages telling anonymous visitors they were signed in.
  - `scripts/check-metadata.mjs` prints the resolved title/description/robots for every
    route in both locales. It needs the dev server, so it is a manual check, not a gate.
- 2026-09-05 — **VIS-16, loading states.** Grounded in `impeccable harden` plus the
  `ui-ux-pro-max` guideline rows for loading (#10, #12, #14, #19, #32, #78, #118).
  Eight route-level pending states agreed on nothing: three spellings of the spinner size,
  four container heights, and half showed no text at all. All eight now render
  `components/app/loading-state.tsx` with a **contextual** label — "Loading datasets…",
  "Building the report…" — rather than a bare spinner, which is what #78 means by not
  leaving a wait unexplained.
  - The `Spinner` primitive carried `role="status"` and a hardcoded `aria-label="Loading"`.
    Two costs: on a Persian-first product that was the only thing a Persian screen-reader
    user heard, and every spinner being its own live region is exactly what **#118** warns
    against. The icon is now `aria-hidden` decoration and the container owns the status.
    Measured after: **1 live region on screen, spinner `aria-hidden`.**
  - `aria-busy` added to both dialog submits (they were already `disabled`, so #32 held).
  - The step-1 person page rendered a hardcoded English `Error:` prefix; now translated,
    with `role="alert"` per **#44**.
  - The root `app/loading.tsx` stays label-less on purpose: it sits above
    `NextIntlClientProvider`, so an English string there would be the one thing a Persian
    reader hears. Silent status region, documented in the file.
- 2026-09-05 — Both sign-ins gained a **back-to-home** link, from `AuthShell` so the two
  cannot drift. 44px tap target, mirrored arrow, verified not to overlap the card at 1440
  and 390. `patientHint` removed from the landing page and both catalogues, as asked.
- 2026-09-05 — `defaultLocale` was **already** `fa` in `src/i18n/routing.ts`; verified `/`
  and `/console` both 307 to the `/fa` equivalents. Nothing to change.
- 2026-09-05 — **`locale === "fa"` is now 20 occurrences across 14 files**, up from 16 —
  main's new work added three more. The `useDirection()` hook is overdue; still not done.
- 2026-09-05 — **Not** done, deliberately, and still open: the two interstitial route files
  are no longer rendered but still live in `(public)/`, so `/fa/auth-authenticated` remains a
  crawlable page that tells an anonymous visitor they are signed in; and `jwt_verify` failing
  still leaves `authStatus` in `Loading` forever on a bare spinner with no exit. Both were
  scoped out of this pass.
