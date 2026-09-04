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

**The gap that matters most: none of the console work has been seen in a browser.**
Every authenticated route is behind a Django login that has not been available, so
VIS-09, 13, 14, 17 are typechecked and built but visually unverified.

## Decisions log

- 2026-09-04 — No Saderat brand palette exists; user gave a free hand. Direction above is
  ours to own.
- 2026-09-04 — Motion deferred: it does not address the actual problem, which is that the
  palette has no contrast to work with.
