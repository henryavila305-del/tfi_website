# Phase 4 record audit — 2026-11-11

## Confirmed
- Main website `index.html` includes four historical record tables; `records.js` only switches selected panels and never fetches new results.
- `scripts/check-records.mjs` asserts imported historical totals: Top 3 149–108, Premium / Max Bet 64–32, Dog 35–23, Play 24–31 with 2 pushes.
- Supabase `public.tfi_picks` Main Premium records observed read-only:
  - 2026-11-03 Colorado Avalanche vs Columbus Blue Jackets: loss
  - 2026-11-09 New York Islanders vs San Jose Sharks: loss
  - 2026-11-11 Michigan Wolverines -3.5 vs Marquette: pending
- The Nov 3 loss is inside the site's Nov 8 historical cutoff. Without individual historical row matching, overlap is unresolved.
- The Nov 9 loss is after the cutoff, but cannot yet be safely added until provenance and historical import coverage are audited.
- Michigan is classified Main Premium in the current tracker; this differs from the synthetic NCAAB Premium example. No production correction was attempted.

## Isolated implementation
- `reconcile-records.mjs` rejects unverified historical baselines, duplicate IDs and private Premium categories in public Premium calculations.
- `public-record-adapter.mjs` accepts only audited, baseline-reconciled aggregates. It does not fetch production data or expose Premium selections.
- `.github/workflows/daily-card-tests.yml` requests four Node 22 test suites on PR/branch updates.

## Blockers
- Historical source ledger and reliable overlap mapping have not been independently verified; **do not replace 64–32**.
- No public aggregate endpoint exists yet; this adapter is not wired into the website HTML.
- No GitHub Actions runs were returned for the latest commit at inspection time. Test execution therefore remains unverified.
- No Vercel preview URL was available or verified.

Production Supabase, production website, PRs and historical rows remain unchanged.
