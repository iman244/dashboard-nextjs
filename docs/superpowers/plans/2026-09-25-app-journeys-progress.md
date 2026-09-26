# App journeys execution status

The work is integrated in local `green` branches for the separate Next.js and Django repositories. Both original `main` checkouts and their remote branches remain unchanged. Feature branches were created from `green` and merged back to it; no deployment or remote push was performed.

| Slice | Repository | Feature branch | Result |
| --- | --- | --- | --- |
| Design and task map | Next.js | `plan/app-journeys` | Spec, target sitemap, and plan committed |
| Console tasks | Next.js | `feat/console-navigation` | Grouped nav, Find a patient first, monitoring chooser, nested active state |
| Report discovery | Next.js | `feat/report-discovery` | Direct EHR report action, supported Excel types, unsupported report explanation, accessible filters, breadcrumbs and copy |
| Public entry | Next.js | `feat/public-entry-copy` | Staff and patient paths first; active periodical report copy localized |
| Patient portal | Next.js | `feat/patient-portal-auth` | Separate Django JWT sign-in, own-record API, session refresh and cache isolation; direct patient EHR requests removed |
| Role alignment | Next.js | `feat/permission-alignment` | Staff-only navigation and guarded deep links, with retry on role check failure |
| API snapshot | Next.js | `feat/api-contract-sync` | Generated TypeScript types from Django `green` OpenAPI |
| Patient access | Django | `feat/patient-access` | Patient identity, provisioning command, scoped APIs, permission tests, production settings, Docker build fix |

## Verification

- Next.js webpack production build passed with all expected routes, including `/console/record-monitoring` and patient sign-in/records. The default Turbopack build could not bind its internal process port in this sandbox; webpack was used for the final production build.
- `next typegen` and `tsc --noEmit` passed on the merged tree. Nine patient session tests passed. English and Persian message leaf keys match. Changed-file ESLint checks passed.
- Full Next.js ESLint reports 33 errors and 26 warnings; `main` reports 33 errors and 29 warnings. The work added no lint errors. Existing errors are outside the changed slices.
- Django's Docker image built with pinned Django 5.2.7. All 137 tests, system check, migration drift check, and OpenAPI validation passed inside that image using SQLite. Production host and CORS checks passed. PostgreSQL integration was not available locally.
- Independent source reviews checked the feature slices and the combined Next.js branch. Review findings about missing copy, breadcrumbs, direct-route permissions, and Docker `SECRET_KEY` handling were fixed before merge. Browser layout and a live provisioned-patient sign-in were not exercised.

## Release sequence and external dependency

1. Configure a private production `SECRET_KEY` of at least 50 characters, explicit hosts and CORS origins, HTTPS ingress, and a private S3 bucket. Apply the Django migration and deploy Django `green` first.
2. Verify patient identities through an operator process, run `python manage.py provision_patient <national_id>` for each approved account, and deliver generated credentials privately. Existing nonstaff viewer accounts lose monitoring and Bank report read access; review their roles before release.
3. Deploy Next.js `green`, replacing the old national-ID-only patient session. Verify a real patient account, staff lookup, both locales, and desktop/mobile layouts against the deployed API.
4. Patient EHR visits, laboratory results, and X-rays remain unavailable in the portal. The upstream EHR service currently accepts direct credentialless requests. Its owner must restrict direct access, then an authenticated proxy can safely restore those patient features. This code change alone cannot secure the upstream service.

The detailed patient rollout is in the Django `docs/deployment/patient-access.md`; the Next.js client verification note is `docs/patient-portal-verification.md`. The pre-change Graphify report and interactive graph remain in the original Next.js checkout's `graphify-out/` directory; the graph describes the baseline code, while the spec above describes the intended journeys.
