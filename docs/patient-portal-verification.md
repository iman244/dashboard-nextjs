# Patient portal credential switch

The portal authenticates through `/api/auth/patient/jwt/create/` and reads only `/api/saderat-bank-health-monitoring/patient-records/me/`. Patient credentials live in a separate, per-tab sessionStorage entry. The previous national-ID-only entry does not authenticate. Staff localStorage tokens and arbitrary-ID lookup remain separate.

Deploy the Django patient identity migration and authorization changes before this client. Provision patient accounts through the operator command and deliver their passwords offline. EHR visits, laboratory results and X-rays remain unavailable in this portal until upstream access is restricted and an authenticated proxy is deployed.

## Verification

- `node --experimental-strip-types --test tests/patient-session.test.mjs`: 9 passing tests for old sessions, wrong credentials, password preservation, refresh, rejected refresh, account switching, late responses, and cache cancellation/removal.
- `next typegen`, `tsc --noEmit`, scoped ESLint, English/Persian key parity, and `git diff --check`: passed.
- Impeccable detector on changed UI: no findings.
- No EHR, laboratory or X-ray request imports remain in the patient route.
- Production Turbopack build cannot follow this worktree's shared node_modules symlink outside its root. Webpack fallback fails fetching Google Fonts because DNS/network access is unavailable.
- Browser layout and integrated live Django sign-in were not verified here. The automated API checks use mocked HTTP responses; deployment still needs a real provisioned patient account and configured API origin.

Patient cache keys include a fresh session identifier. Sign-out and a new sign-in cancel and remove patient queries without clearing staff queries. Refresh and records responses check the current session before returning data, preventing late responses from restoring a prior account.
