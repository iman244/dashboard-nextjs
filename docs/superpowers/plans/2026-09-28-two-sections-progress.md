# Two sections: execution status

Plan: `2026-09-28-two-sections.md` (19 tasks: 1–18 plus 3b). Spec: `../specs/2026-09-28-two-sections-design.md`.

## Execution strategy (approved by the user 2026-09-28)

- **Method:** subagent-driven (superpowers:subagent-driven-development). The orchestrating chat only dispatches, runs checkpoints and talks to the user; it does not read diffs.
- **Implementer model:**
  - **Opus:** Tasks 1, 3, 4, 10, 11, 13, 14, 16.
  - **Sonnet:** Tasks 2, 3b, 5, 6, 7, 8, 9, 12, 15, 17, 18.
- **Agents** (created 2026-09-28 in `/Users/iman244/Repositories/mainreport/.claude/agents/`):
  - `two-sections-implementer`: effort high; the model is passed per dispatch (opus or sonnet as listed above).
  - `two-sections-reviewer`: opus, effort high, read-only.
  - `two-sections-final-reviewer`: opus, effort max, read-only.
  - They are loaded at session start. If a dispatch says the agent type is unknown, restart the session or fall back to `general-purpose` with the agent file's body pasted into the prompt.
- **Django settings** for local runs: `/Users/iman244/Repositories/mainreport/.claude/dev/walk_settings.py` (stable path, not the scratchpad).
- **Review:** one Opus reviewer after every task. It checks spec and plan compliance, runs the tests itself, and hunts for bugs. At most 2 review→fix rounds, then escalate to the orchestrator; design questions go to the user.
- **One task per implementer**, fresh context each time.
- **Parallelism:** only the opening lane runs in parallel. **Lane A** is Django Tasks 1 → 2 → 3 → 4, in sequence. **Lane B** is Next.js Tasks 6 → 3b → 7, in sequence, because 6 and 3b both edit `src/lib/campaign.ts`. The two lanes run side by side (different repos). Task 5 starts only when both lanes are done; everything after is sequential.
- **Environment:** the orchestrator owns the Postgres container `mainreport-walkthrough-pg` (:55432), Django :8001, Next :3000 and the browser checks. Subagents only run tests.
- **Checkpoints:** after each of the 5 slices the orchestrator brings the servers up, runs the browser pass, and waits for the user's go.
- **Final gates:** a whole-branch review (Opus, max effort) and a separate security review of the slice 1 permission change.
- **Record:** tick the plan checkboxes and update this file after every task.

## Branches

- Next.js: `feat/two-sections` in `dashboard-nextjs-app-journeys`, stacked on `feat/patient-page` → `fix/journey-gaps` → `app-journeys`.
- Django: `feat/two-sections`, to be created from `feat/person-reports` in `dashboard-django-app-journeys` (Task 1 Step 1).
- Nothing is pushed or merged without the user.

## Task status

| Task | Status | Commits |
|---|---|---|
| 1 | done, review clean | Django 5d74f7e..ef4a761 |
| 2 | done, 1 fix round | Django ef4a761..a5938a6 |
| 3 | done, review clean | Django a5938a6..dbcaf23 |
| 4 | done, 1 fix round | Django dbcaf23..b108449 |
| 6 | done, 1 fix round | Next 61ac3a3..4878fe5 |
| 3b | done | Next 4878fe5..d93de23 |
| 7 | done, review clean | Next d93de23..c866951 |
| 5 | done, review clean | Next c866951..f61cf33 |
| 8 | done, review clean | Next 8068ea0..279b0c8 |
| 9 | done, 2 fix rounds | Next 279b0c8..fb73b62 |
| 10 | done, review clean | Next fb73b62..1d1d3f7 |
| 11 | done, review clean | Next 1d1d3f7..c936bad |
| 12 | done, 1 fix round | Next c936bad..48eec6d |
| 13 | done, review clean | Next 48eec6d..a58a24b |
| 14 | done, 2 fix rounds | Next a58a24b..ea564a6 |
| 15 | done, review clean | Next ea564a6..064159c |
| 16 | done, 1 fix round | Next 064159c..2d0ce5c |
| 17 | done, 1 fix round | Next 2d0ce5c..59c2c4f |
| 18 | done, review clean | Next 59c2c4f..9f89d93 |
| Final fix wave | done, 2 rounds | Next 9f89d93..a83d8db; Django b108449..72f75a4 |

**Final state (2026-09-28):** Django 168 tests OK; Next tsc 0, check-messages clean (en/fa parity), 29 node tests, no file gained lint problems. Final whole-branch review → fix wave → re-review clean. Security review: no write bypass; two read-side policy questions open for the user (see below). Browser: 96 route checks (staff/viewer × fa/en × 1366/390), 10/10 old-address redirects, patient portal sign-in, national-ID box, EHR inline errors with no global dialog.

**Open for the user (security policy, not decided by the orchestrator):**
1. `IsConsoleReader` reads as "signed in and not a patient": no positive console marker, so an account whose patient identity is deleted (or any stray account) reads all monitoring data.
2. Viewers can bulk-read: `patient-entries/` is unpaginated and unthrottled (with presigned image URLs), `?national_id=` there bypasses the patient-records throttle, and `monitorings/{id}` returns whole sheets (the charts need them).

**Needs a post-deploy check:** EHR tabs rendering with real data (no EHR upstream locally).

**Checkpoint 1 (2026-09-28):** 35/35 API checks against the live server (staff, viewer, patient, anonymous; counts; person rows; upload warnings; unreadable refusal). Browser: two-section sidebar and home in fa and en, staff and viewer, 390px with no overflow; the Step 1 report renders identically from a numeric and a text-only upload.

**Rulings made during execution** (full list in the orchestrator's final report):
- `UploadIssue` types `no_rows` and `missing_id_column` as warnings (plan Task 5 said error).
- Task 8 removes the section-wide `StaffOnlyConsoleSection` from `monitorings/layout.tsx`; staff-only child routes keep their own guard.
- Task 10 adds the rows-table message keys (the plan put them in Task 11).
- `fullNationalId` also strips invisible direction marks, and the patient paths escape the id.
- Patient records nest a count-free monitoring type (no fake zero counts on `/me/`).
