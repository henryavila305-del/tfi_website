# TFI member preview review — November 12, 2026

Existing website draft PR #7 already contained a Whop OAuth shell, sealed identity cookies, live entitlement checks and a server-gated Premium board. This phase extends that isolated branch; the tracker, production main and other PRs are unchanged.

## Confirmed repairs

- All four previous CI jobs failed because the workflow ran checks without installing iron-session and the Whop SDK. Added npm ci --ignore-scripts with the existing committed lockfile.
- Prevent an in-flight refresh from restoring picks after sign-out. Clear cards when the page is hidden or restored before rechecking membership.
- Keep sign-out and retry available for inactive memberships and upstream errors. Sign-out expires both identity and OAuth cookies without depending on a working Whop lookup.
- Reject future/expired OAuth attempts, missing codes and nonnumeric token expiry. Return invalid callbacks and unavailable login to a readable member-page state.
- Require exact boolean grants for both category selection and tier labels; prevent a truthy malformed grant from labeling Premium as All Access.
- Bound membership requests, disable retries and prevent browser/CDN caching of member responses. Database access remains GET-only.
- Show posted odds, included categories even on an empty board, clear access status, membership management and a keyboard skip link.

## Verified locally

- Existing seven source, interaction, records, spotlight, Top 3, scores and member checks passed.
- 18 new Node tests passed. Includes successful OAuth exchange/session, forged/expired attempts, invalid nonce/audience/subject, anonymous denial, actual handler tier isolation, access revocation, provider failure, no-store, sign-out cookies and frontend response races.
- Build allowlist/source-byte matching and repeat build passed. Only public assets enter dist; no lib, API, credentials or paid fixture selections are copied.
- Tests use the exact locked dependencies; provider/database requests are synthetic. No production database request or write is part of the suite.

## Remaining integration evidence

The prior Vercel branch deployment reported Ready, but its preview is behind Vercel authentication. This session could not inspect its runtime environment or complete a real Whop sign-in. Whop OAuth app/callback, product mappings, company read permissions, branch-only secrets and a staging pick source need verification before real-member acceptance.

Browser acceptance of the revised UI and live Premium / All Access / denied-member accounts remains pending until the preview can be opened. A successful CI or Vercel build alone does not prove membership configuration.

No production activation, merge, database migration, billing change or newly issued credential is included.
