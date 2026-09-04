# UI/UX Pass — Charter

> **Read this file first** when resuming work on this branch. It is the single
> source of truth for scope, constraints, and status. Everything else is detail.

**Branch:** `feat/ui-ux-pass`
**Worktree:** `/Users/iman244/Repositories/mainreport/dashboard-nextjs-ui-ux`
**Base:** `main` @ ab4d68d
**Started:** 2026-09-04

---

## Goal

Improve the UI/UX of the dashboard-nextjs reporting console without changing
what any screen does or which data it shows.

## Non-goals

Explicitly out of scope. If one of these looks tempting mid-task, stop and ask.

- Backend / API changes (that work lives on `feat/api-types-and-upload-type`)
- New features, new routes, new reports
- Renaming or restructuring i18n message namespaces (just finished; do not churn)
- Dependency major-version bumps (TanStack v9 and recharts 3 just landed)

---

## Global Constraints

Every task inherits these. Violating one is a rejected task, not a tradeoff.

1. **Bilingual en/fa → RTL is a first-class layout mode.** Every visual change
   must be verified in both directions. Prefer logical CSS properties
   (`margin-inline-start`, `ps-*`/`pe-*`, `start-*`/`end-*`) over physical
   (`ml-*`, `left-*`).
2. **No hardcoded user-facing strings.** All copy goes through the route-scoped
   namespaces in `messages/en.json` + `messages/fa.json`. The two files must
   stay at key parity (227 keys as of base commit).
3. **Stack is fixed:** Next.js App Router, Tailwind, shadcn/ui (`components.json`),
   TanStack Table v9, recharts 3, next-intl.
4. **`npx tsc --noEmit` and `npm run build` must pass before any commit.**
   `npm run lint` does **not** pass at baseline (see Baseline below) — the bar
   is *do not make the counts worse*, not *reach zero*.
5. **Persian digits, Jalali dates, and number formatting** are correctness
   concerns, not cosmetic ones. Do not "clean up" formatting logic.

---

## Surface Area

Routes in scope (14 pages):

| Group | Route |
|---|---|
| public | `/`, `/form-sabt-payesh`, `/auth-authenticated`, `/console-unauthenticate`, `/loading` |
| auth | `/authentication` |
| console | `/console`, `/console/electronic-health-record`, `/console/form-sabt-payesh`, `/console/patient-reports`, `/console/periodical-reports` |
| console | `/console/saderat-bank-health-monitoring` (+ `/[id]`, `/[id]/[national_id]`) |

---

## Baseline (main @ ab4d68d, measured 2026-09-04)

Compare against these numbers before every commit. Do not let them grow.

| Check | Result |
|---|---|
| `npm run build` | ✅ passes (27 static pages) |
| `npx tsc --noEmit` | ✅ 0 errors — **but only after a build** (see below) |
| `npm run lint` | ❌ 81 problems: **33 errors, 48 warnings** |

Lint problems by rule:

| Rule | Count | Note |
|---|---|---|
| `@typescript-eslint/no-unused-vars` | 48 (warnings) | dead imports/vars |
| `react-hooks/static-components` | 25 (errors) | components declared inside components — mostly `saderat-bank-health-monitoring/[id]/page.tsx` around line 253 |
| `react-hooks/set-state-in-effect` | 6 (errors) | incl. `src/hooks/use-mobile.ts:14` |
| `react-hooks/purity` | 1 | |
| `react-hooks/preserve-manual-memoization` | 1 | |

**Gotcha — typecheck needs a build first.** `next-env.d.ts` is gitignored and
Next 16 generates `PageProps` / `LayoutProps` as globals into `.next/types` at
build time. In a fresh worktree, `npx tsc --noEmit` fails with 5 bogus
`Cannot find name 'PageProps'` errors until `npm run build` has run once.
Always: `npm install` → `npm run build` → `npx tsc --noEmit`.

**Gotcha — check exit codes correctly.** `cmd | tail -5; echo $?` reports
`tail`'s status, not `cmd`'s. Use `set -o pipefail` and `${PIPESTATUS[0]}`.

---

## Status

| Phase | State | Artifact |
|---|---|---|
| 1. Audit | not started | `01-AUDIT.md` |
| 2. Plan | not started | `docs/superpowers/plans/` |
| 3. Execute | not started | checkboxes in the plan |
| 4. Verify | not started | tsc + lint + build + browser check, both directions |

## Decisions Log

Append one line per decision that a future reader could not infer from the code.

- 2026-09-04 — Audit-first: findings get IDs and a written plan before any code changes.
- 2026-09-04 — Worktree is a sibling dir, not `.claude/worktrees/`, because
  `mainreport/` is not itself a git repo and `.claude` is not gitignored.
- 2026-09-04 — Lint is red at baseline (33 errors). Decided not to gate the
  UI/UX work behind fixing it; the rule is "don't make it worse." Whether to
  clean it up is a separate, open question for the user.
