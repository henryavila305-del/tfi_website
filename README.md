# The Favorite Index

Standalone static public website with responsive navigation, an empty free-picks board, six-sport public status panel, two Whop membership links, and four imported historical aggregate records. Historical selections remain private; net units and ROI are withheld.

## Local review

Requires Node 22 or newer, with no dependencies to install. Run npm run check, npm run build:check, then npm run dev. Open http://127.0.0.1:4173. Build verification checks the exact five public assets twice against source. Direct builds also refuse unexpected output files; move any unreviewed files out of dist before rebuilding. Negative build tests run in an isolated temporary fixture.

## Public picks preparation

See PUBLIC_PICKS.md for the strict public-entry contract and remaining owner decisions. content/public-picks.json remains empty and checks enforce that hold. A static renderer is prepared and tested with synthetic entries; no feed, database, collection form, analytics or private data integration is added.

## Review PR #5

Start with [REVIEW_GUIDE.md](REVIEW_GUIDE.md) for scope, code-review order, automated checks and current browser evidence. [LAUNCH_INPUTS.md](LAUNCH_INPUTS.md) lists the exact owner decisions still needed. PR #5 remains an open draft; this packet does not authorize merging or publishing.

## Current evidence and release hold

PR #1 and historical-record PR #3 are merged. HISTORY_REVIEW.md describes the imported record. QA.md records historical browser evidence, not certification of subsequent page changes. RELEASE_REVIEW.md records remaining launch gates.

The validation workflow runs checks on Node 22/24 and Linux/Windows, with read-only repository permissions and no publishing steps. vercel.json disables automatic Git-triggered Vercel deployment on this branch; this does not remove an existing hosted version.

Whop plan names/prices, current branding, public copy and historical-result disclosures are owner-confirmed; see the version-specific records in LAUNCH_INPUTS.md. Before launch, complete final destination/link review, resolve the separate legal/privacy text, complete current-page accessibility/browser review, and resolve hosting/environment, DNS ownership and redirects separately. Every public pick requires the owner's individual approval; private/member picks are excluded. Approved future picks must be posted before the event, with UTC actual-publication times and no backdating. DraftKings is selected for recorded odds and ESPN for final-result reference. The owner approved individual approval before posting each grade; win percentage calculated as wins / (wins + losses), excluding pushes and voids; postponed games remaining pending until the owner approves a final outcome; and visible grading corrections (PUBLIC-PICK-GRADING-01). Actual-first-publication/source evidence, approval-record details, first-posted odds capture with original-price preservation, grade-approval evidence and visible correction history must be implemented before enabling entries. DraftKings New York is the selected odds-source jurisdiction (PUBLIC-PICK-JURISDICTION-01); the owner's answer was NYC, recorded as New York (NY), United States. Public performance reporting is limited to win/loss records for now; stake amounts, net units, profit and ROI remain withheld (PUBLIC-PICK-METRICS-01). This retains the approved win-percentage calculation and transparent push/void/pending statuses; recorded pick odds and membership prices are not profit claims. Withdrawing a public pick requires individual owner approval; the entry must remain visible with a reason and UTC withdrawal time, and be excluded from win percentage (PUBLIC-PICK-WITHDRAWAL-01). Exact wager-market evidence and withdrawal evidence/rendering implementation remain pending. Do not connect private trackers, Supabase, credentials, or the purchased domain.

The owner selected Twitter/X @thefavindex as the website's public contact (PUBLIC-CONTACT-01), using https://x.com/thefavindex. No public email address was supplied. A plain footer link is prepared in this draft; no social embed, email address or outbound message is added. Legal/privacy and entity details remain separate inputs. Publication and deployment stay blocked.

The owner confirmed thefavindex.com as the website's primary domain (PRIMARY-DOMAIN-01). This records the intended domain only; domain connection, DNS changes, redirects and deployment are not authorized. Both holds remain enforced.
