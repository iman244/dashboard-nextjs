# App Journeys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make staff and patient journeys clear, direct, and correctly authorized across the Next.js console and Django API.

**Architecture:** Keep existing route URLs and shared UI, adding a task-oriented console route and centralized navigation metadata. Introduce a Django patient identity and own-record endpoint before replacing the portal's insecure browser gate. Keep the patient EHR surface unavailable until upstream access can be restricted.

**Tech Stack:** Next.js 16, React 19, next-intl, TanStack Query, Django REST Framework, SimpleJWT, PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-09-25-app-journeys-design.md`

**Execution status:** Implemented on local `green` in both repositories. See `docs/superpowers/plans/2026-09-25-app-journeys-progress.md` for merged commits, verification, and release dependencies. The checklists below preserve the original execution plan; the progress file records the actual result.

## Global Constraints

- Work only on feature branches from local `green`, merge each accepted slice into local `green`; leave `main` unchanged.
- Persian and English message keys stay in parity, and RTL uses logical positioning.
- Preserve existing public and console routes; change navigation destinations only where the spec states.
- Patient credentials and staff credentials must remain separate.
- Never present patient EHR, laboratory, or X-ray as secured while the upstream API remains directly reachable.
- Read relevant Next.js 16 local docs before UI edits. Attempt `npx @tanstack/intent@latest list` per `AGENTS.md`; network limits may prevent it.

## Review Focus

- A valid but unknown national ID must receive the same sign-in error as a wrong password.
- A patient JWT must not read another patient's entries, monitoring types, Bank reports, or arbitrary patient-record lookups.
- A nested records route must show Record monitoring as the active navigation task.
- An unsupported Bank monitoring type must not be selectable for upload, while an existing report stays listed with an explanation.
- Patient sign-out and a second sign-in on one device must not show cached records from the prior patient.

## Task 1: Django identity and authorization

**Files:** `dashboard-django-green/saderatBankHealthMonitoring/{models.py,views.py,urls.py,tests.py}`, a migration, an operator provisioning command, `medicaldashboard/settings/production.py`, `openapi.yaml`.

**Interfaces:** Add a normalized unique patient identity linked to `User`; expose authenticated `GET /api/saderat-bank-health-monitoring/patient-records/me/`; retain staff-only `GET /api/saderat-bank-health-monitoring/patient-records/?national_id=...`.

- [ ] Write API tests for anonymous denial, patient own data, cross-patient denial, unprofiled denial, staff lookup, and denial of patient tokens on general report/type/entry endpoints.
- [ ] Run targeted Django tests and confirm they fail against the current permissive implementation.
- [ ] Add identity model, migration, staff-only provisioning path, permissions, endpoint, and explicit production CORS/hosts.
- [ ] Run targeted and full Django tests, `check`, migration check, and export the OpenAPI schema.
- [ ] Commit on a Django feature branch and merge to Django `green` after review.

## Task 2: Console navigation and monitoring task entry

**Files:** `dashboard-nextjs-green/src/app/[locale]/(authenticated)/console/{_nav/items.ts,_sidebar/sidebar.tsx,client.tsx,record-monitoring/page.tsx}`, locale catalogs and relevant monitoring pages.

**Interfaces:** `CONSOLE_NAV_ITEMS` carries task group and active-route information; `/console/record-monitoring` lists monitoring types and links to their entries.

- [ ] Define grouped task map with Find a patient first and a real Console home link; map nested records paths to Record monitoring.
- [ ] Render matching sidebar and home sections, with accessible active state and clear purpose text; link the FormAfzar item to its console route.
- [ ] Add the monitoring chooser with loading, empty, error, and schema states; retain the type management page for staff.
- [ ] Verify staff and viewer navigation, nested active state, fa/en copy, mobile layout, typecheck, lint, and build.
- [ ] Commit on a Next.js feature branch and merge to Next.js `green` after review.

## Task 3: Report and patient-finding affordances

**Files:** Bank upload/list components, EHR columns/client, patient-report client, page headers, locale catalogs.

- [ ] Restrict Excel type options to `isKnownSBHM_Type`; explain existing unsupported report detail rows.
- [ ] Expose a labeled EHR-to-patient-report action without requiring the row overflow menu.
- [ ] Add route-appropriate orientation text and breadcrumbs, localize hardcoded interface copy, and make removable filter chips real buttons.
- [ ] Verify upload options, EHR report query preservation, keyboard focus, fa/en/RTL, typecheck, lint, and build.
- [ ] Commit on a Next.js feature branch and merge to Next.js `green` after review.

## Task 4: Patient portal credential switch

**Files:** patient sign-in/provider/store/records routes, patient record API client, shared patient record section, locale catalogs, generated API types if used.

**Interfaces:** Authenticate with Django JWT for an account linked to the submitted national ID; fetch `/patient-records/me/` with the patient token. The existing arbitrary-ID staff client continues to send the staff token.

- [ ] Add patient session tests or focused verification for wrong credentials, expired token, sign-out cache clearing, and second account.
- [ ] Replace national-ID-as-password/EHR probe with Django credentials and own-record lookup; remove patient direct EHR/lab/X-ray calls from the patient route.
- [ ] Update sign-in and records copy to describe the actual available data and account provisioning.
- [ ] Verify patient and staff token isolation, fa/en routes, typecheck, lint, and build.
- [ ] Commit on a Next.js feature branch and merge to Next.js `green` after review.

## Task 5: Integrated review and handoff

- [ ] Recheck both `green` branches, compare against their `main` bases, and run final meaningful verification once.
- [ ] Review the target sitemap and all four journeys against the spec; record any external upstream dependency in a deployment note.
- [ ] Report exact branch/commit positions, passed checks, remaining limitations, and links to the plan and touched files. Do not merge either `green` into `main`.
