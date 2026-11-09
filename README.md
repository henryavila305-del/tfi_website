# The Favorite Index — Phase 1

## Premium Tracker preview

See [tracker/README.md](tracker/README.md) for the isolated beta. `/tracker/` on branch previews is a labeled synthetic example. The account-enabled beta runs locally only. Production memberships and data are not connected by this branch.

Standalone public website preview. Responsive black, charcoal, and electric-green design with accessible navigation, free picks, results, sports exploration, Premium entry, and methodology.

## Local review

Requires Node.js 22 or newer. Run `npm run check`, `npm run build`, then `npm run dev`. Open http://127.0.0.1:4173. Static build output is in `dist/` (ignored by Git). No dependencies to install.

`npm run build:check` builds twice and verifies that output contains exactly the four public assets, matching source byte for byte. If npm is unavailable, run `node scripts/check.mjs`, `node scripts/check-interactions.mjs`, `node scripts/check-build.mjs`, and `node scripts/serve.mjs` directly.

## Automated validation

The PR validation workflow runs source/content checks, simulated focus/menu transitions, repeatable build checks, and whitespace validation on Node 22/24 on Linux and Windows. It requests read-only repository contents and disables persisted checkout credentials. It has no deployment, publishing, or domain steps. These checks do not replace the remaining browser/device and screen-reader review in QA.md.

## Content boundaries

- No fabricated selections, statistics, odds, or returns. Picks and results are explicitly empty.
- Premium entry stays disabled until a verified official TFI Whop URL is supplied. No private selections or membership data.
- Sports links update a public-status panel; these are not live data pages.
- Methodology describes publication requirements, not an operational model or verified feed.
- No analytics, cookies, forms, payments, remote fonts, APIs, or secrets.
- Navigation and FAQ work without JavaScript; mobile menu and sport panel are progressive enhancements.

## Release hold

See RELEASE_REVIEW.md for the content review, verified engineering evidence, and remaining launch gates. See QA.md for exact browser coverage and limitations.

Draft PR only. Do not merge, deploy, connect thefavindex.com, or modify TFI Live Tracker, Supabase, picks, or credentials. No deployment workflow is included.

Before a separately authorized launch: approve brand and content, supply the official Whop URL, approve grading rules and public publication process, complete browser/accessibility review, and review applicable legal/privacy copy. Domain and hosting decisions are outside Phase 1.

