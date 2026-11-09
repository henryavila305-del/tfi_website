# PR #5 review guide

Status: open draft for review. Publication, merge and deployment remain on hold.

## What this PR changes

The empty public board now has a strict public-entry contract and an escaped static renderer, ready for future manually approved entries. Production content remains [] and direct builds deliberately reject nonempty lists. Only synthetic examples appear in ignored local previews.

Cards have named article headings, UTC times, explicit result labels, wrapping metadata and narrow-card layouts. Populated previews update the board count. Sports and FAQ copy remain accurate with either empty or populated boards.

Builds reject unexpected output files and non-file entries before writing. Generated heading IDs cannot conflict with retained page IDs. Failure tests use isolated temporary fixtures and never rewrite the real picks file.

Accessibility fixes include system-color chart paints, a single-column sports grid at <=320px to prevent clipped college labels, and separation between membership actions.

## What already existed before this PR

PR #1 and historical-record PR #3 were merged before this work. The public page already had navigation, six sport links, native FAQ, two Whop membership links and four imported historical aggregate charts/tables. This PR does not re-import or expand the historical record.

## Review the files in this order

1. [PUBLIC_PICKS.md](PUBLIC_PICKS.md): contract, public/private boundary and local preview instructions.
2. scripts/public-picks.mjs and scripts/render-public-picks.mjs: validation, escaping, status/content slots and accessible heading references.
3. scripts/build.mjs and scripts/check-build-safety.mjs: empty-content hold, output allowlist and isolated failure checks.
4. [PR_REVIEW.md](PR_REVIEW.md): correctness findings and fixes.
5. Browser evidence below, then [LAUNCH_INPUTS.md](LAUNCH_INPUTS.md).

## Validation and evidence

Run npm run check and npm run build:check with Node 22 or newer; no dependencies are required. The GitHub Actions matrix runs Node 22/24 on Linux/Windows, with read-only contents and no publishing steps. Inspect the exact current head's checks rather than treating earlier green runs as proof for later edits.

| Evidence | Actual scope |
| --- | --- |
| [PICK_CARD_QA.md](PICK_CARD_QA.md) | Isolated and full-page synthetic cards; native fallback and history integration; index to later evidence. |
| [KEYBOARD_CONTRAST_QA.md](KEYBOARD_CONTRAST_QA.md) | Targeted forced-colors emulation, visible focus, compact Menu and keyboard history/table checks. |
| [ZOOM_QA.md](ZOOM_QA.md) | Completed section-by-section 400% review in the documented Edge window, verified layout fixes and restored normal zoom. |
| [QA.md](QA.md) | Historical Phase 1 evidence; its disabled-link/empty-results/four-file observations are not current. |
| [HISTORY_REVIEW.md](HISTORY_REVIEW.md) | Historical aggregate source/scope/disclosures, not new publication permission for future picks. |

Remaining engineering coverage: Firefox/Safari, physical devices, screen-reader output, additional forced-color palettes and a complete forced-colors traversal. The documented 400% section review is complete for that one window; it is not a universal accessibility certification.

## Recorded owner decisions

Whop plan names and displayed prices are confirmed: All Access $35.99/month and Premium $9.99/month. See WHOP-PLAN-PRICE-01 in LAUNCH_INPUTS.md. Current branding, public copy and historical-result disclosures are also approved at b5f03924d0fc8a96a84512d04033f1ca3344823b; see BRAND-CONTENT-01 in LAUNCH_INPUTS.md. Individual owner approval is now required for each public pick, with private/member picks excluded (PUBLIC-PICK-APPROVAL-01). Pre-event-only posting, UTC publication times and no backdating are also confirmed (PUBLIC-PICK-TIMING-01). Trusted actual-first-publication evidence remains an implementation gate. DraftKings odds and ESPN final-result reference are also selected (PUBLIC-PICK-SOURCES-01). Approval-record details, source capture/evidence, price-change and settlement/correction rules, legal/privacy, hosting/domain and release authorization remain pending. Both holds are explicitly retained.

## Holds and safe review

- content/public-picks.json stays []; do not add real, private or unapproved picks to this public repository.
- vercel.json has git.deploymentEnabled=false on this branch. This blocks Git-triggered Vercel deployment for this branch; it does not remove an already hosted version or prove the state of every external hosting setting.
- The workflow validates only. No merge, DNS, production publishing, account or billing action is included.
- Review and record the owner decisions in LAUNCH_INPUTS.md before implementing a future change that lifts either hold. Structural publicApproved fields do not independently establish authorization.
