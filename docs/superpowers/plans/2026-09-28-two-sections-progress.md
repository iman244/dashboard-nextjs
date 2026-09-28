# Two sections: execution status

Plan: `2026-09-28-two-sections.md` (19 tasks: 1–18 plus 3b). Spec: `../specs/2026-09-28-two-sections-design.md`.

## Execution strategy (approved by the user 2026-09-28)

- **Method:** subagent-driven (superpowers:subagent-driven-development). The orchestrating chat only dispatches, runs checkpoints and talks to the user; it does not read diffs.
- **Implementer model:**
  - **Opus:** Tasks 1, 3, 4, 10, 11, 13, 14, 16.
  - **Sonnet:** Tasks 2, 3b, 5, 6, 7, 8, 9, 12, 15, 17, 18.
- **Effort:** set through two project agent definitions in `/Users/iman244/Repositories/mainreport/.claude/agents/`, an implementer and a reviewer, both `high`. The final whole-branch reviewer runs at `max`.
- **Review:** one Opus reviewer after every task. It checks spec and plan compliance, runs the tests itself, and hunts for bugs. At most 2 review→fix rounds, then escalate to the orchestrator; design questions go to the user.
- **One task per implementer**, fresh context each time.
- **Parallelism:** only the opening lane runs in parallel (Django Tasks 1–4 alongside Next.js Tasks 3b, 6, 7, in different repos). Everything else is sequential.
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
