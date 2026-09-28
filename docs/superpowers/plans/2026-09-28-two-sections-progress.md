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

| Task | Status | Commit |
|---|---|---|
| 1–18, 3b | not started | |
