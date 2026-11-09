# The Favorite Index

Standalone static public website with responsive navigation, an empty free-picks board, six-sport public status panel, two Whop membership links, and four imported historical aggregate records. Historical selections remain private; net units and ROI are withheld.

## Local review

Requires Node 22 or newer, with no dependencies to install. Run npm run check, npm run build:check, then npm run dev. Open http://127.0.0.1:4173. Build verification checks the exact five public assets twice against source.

## Public picks preparation

See PUBLIC_PICKS.md for the strict public-entry contract and remaining owner decisions. content/public-picks.json remains empty and checks enforce that hold. A static renderer is prepared and tested with synthetic entries; no feed, database, collection form, analytics or private data integration is added.

## Current evidence and release hold

PR #1 and historical-record PR #3 are merged. HISTORY_REVIEW.md describes the imported record. QA.md records historical browser evidence, not certification of subsequent page changes. RELEASE_REVIEW.md records remaining launch gates.

The validation workflow runs checks on Node 22/24 and Linux/Windows, with read-only repository permissions and no publishing steps. vercel.json disables automatic Git-triggered Vercel deployment on this branch; this does not remove an existing hosted version.

Before launch, confirm current Whop destinations/prices and approval evidence, approve brand/public copy and legal/privacy text, complete current-page accessibility/browser review, and decide hosting/domain separately. Public pick publication additionally needs approved release and grading rules. Do not connect private trackers, Supabase, credentials, or the purchased domain.
