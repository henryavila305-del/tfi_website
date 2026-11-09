# Current release review

Development review is ready to inspect; launch is on hold. PR #5 remains an open draft. Use [REVIEW_GUIDE.md](REVIEW_GUIDE.md) as the current review entry point and [LAUNCH_INPUTS.md](LAUNCH_INPUTS.md) as the current owner-decision checklist.

## Implemented

The base website already contains responsive navigation, six sport links, native FAQ, enabled Whop plan links and four imported historical aggregate charts/tables. PR #5 adds validated static public-pick rendering, accessible card layouts, isolated/full-page synthetic previews, consistent populated-board status/copy, output safeguards and regression checks. It also fixes forced-color chart paints, narrow college-sport labels and adjacent membership-action spacing.

Production picks remain empty. Direct builds reject nonempty lists. The output remains exactly five static assets; synthetic fixtures, contract files and approval references do not ship. No live feed or private tracker/database connection is added.

## Evidence

Automated checks cover source links/ARIA/assets, simulated focus/menu/sports interactions, historical arithmetic/category selection, entry validation/rendering, full-page previews, heading-ID collisions, isolated direct-build failure paths and repeatable allowlisted output.

Targeted Edge evidence includes script-omitted fallback, keyboard navigation, forced-colors emulation and the completed 400% section review in the documented window. See the evidence table in REVIEW_GUIDE.md for scope. QA.md is historical Phase 1 evidence, not the current release checklist.

Remaining coverage includes screen readers, Firefox/Safari, physical devices and complete/multiple-palette forced-colors testing.

## Unresolved launch decisions

Whop plan names and displayed prices are owner-confirmed (WHOP-PLAN-PRICE-01 in LAUNCH_INPUTS.md). Current branding, public copy and historical-result disclosures are also owner-approved at b5f03924d0fc8a96a84512d04033f1ca3344823b (BRAND-CONTENT-01). The owner has also confirmed individual approval for each public pick and exclusion of private/member picks (PUBLIC-PICK-APPROVAL-01). Pre-event-only posting, UTC publication times and no backdating are also owner-confirmed (PUBLIC-PICK-TIMING-01). Before real entries can be enabled, actual-first-publication evidence must enforce that rule; validating typed dates alone is insufficient. DraftKings is selected for recorded odds and ESPN for final-result reference (PUBLIC-PICK-SOURCES-01). No source integration is connected. Still needed: approval-record details, source capture/evidence and price-change/settlement/correction rules, legal/privacy decisions, hosting/domain decisions and separate release authorization. Exact requested decisions and the existing evidence are in LAUNCH_INPUTS.md.

The Whop URLs are already implemented; do not describe them as absent. The confirmed plan/pricing record is in LAUNCH_INPUTS.md. Existing destinations remain subject to the final pre-release link check; no new independent checkout verification is claimed.

## Holds

vercel.json disables Git-triggered Vercel deployment on this branch. Existing hosted versions are unaffected. GitHub Actions validates only and does not publish.

No merge, production deployment, domain connection, database, credential, private pick or billing change is authorized by this review packet.
