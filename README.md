# The Favorite Index

Standalone static public website with responsive navigation, an empty free-picks board, six-sport public status panel, two Whop membership links, and four imported historical aggregate records. Historical selections remain private; net units and ROI are withheld.

## Local review

Requires Node 22 or newer, with no dependencies to install. Run npm run check, npm run build:check, then npm run dev. Open http://127.0.0.1:4173. Build verification checks the exact five public assets twice against source. Direct builds also refuse unexpected output files; move any unreviewed files out of dist before rebuilding. Negative build tests run in an isolated temporary fixture.

## Public picks preparation

See PUBLIC_PICKS.md for the strict public-entry contract and remaining owner decisions. content/public-picks.json remains empty and checks enforce that hold. A static renderer is prepared and tested with synthetic entries; no feed, database, collection form, analytics or private data integration is added.

## Review PR #5

Start with [REVIEW_GUIDE.md](REVIEW_GUIDE.md) for the consolidated checklist: completed safeguards, confirmed decisions, remaining blockers and bounded validation evidence. [LAUNCH_INPUTS.md](LAUNCH_INPUTS.md) preserves owner approval records; [RELEASE_REVIEW.md](RELEASE_REVIEW.md) gives the short release status.

Synthetic withdrawals, visible corrections and prior-snapshot retention checks are prepared. Real public content stays []; original odds remain recorded, approval references are not rendered and no private selections ship. Trusted approval/source capture, baseline storage and future publication-path integration remain gates.

PR #5 is an open draft. No merge, publication or deployment is authorized. vercel.json disables Git-triggered deployment for this branch; existing hosted versions are unaffected. GitHub Actions validates only. No tracker, database, credentials, domain/DNS or hosting changes are included.
