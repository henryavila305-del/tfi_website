# Phase 5 — reconciled evidence and read-only overlay

## Source evidence
The original `TFI_Record_Tracker_Updated_Nov8.xlsx` workbook was located in the user's Library and its `Pick Ledger` inspected. Row 433 (worksheet row) is 2026-11-03 Colorado Avalanche ML -125 vs Columbus Blue Jackets, **Loss**, categorized `Lock of the Day`, Premium=Yes. This matches the production Supabase Main Premium loss and is already within the site's 64–32 historical cutoff: **exclude from any post-Nov8 increment**.

The workbook ends on 2026-11-08 and has a 2026-11-08 Anaheim Ducks ML Premium Win. No 2026-11-09 entry is in this Nov8 workbook. Production Supabase has a 2026-11-09 New York Islanders ML -135 Main Premium loss, graded; candidate new post-cutoff result. Subject to independent confirmation of source completeness and classification, the Main Premium arithmetic would be 64–33. This is **not certified** and must not be published as verified.

On 2026-11-11 Supabase records Michigan Wolverines -3.5 vs Marquette as **Main Premium**, pending, and Charleston -1.5 vs Temple as **NCAAB Premium**, pending. The earlier Michigan NCAAB Premium / Play of the Day was synthetic. No production correction or public Play designation is authorized.

## Website integration
`records.js` now optionally fetches same-origin `verified-records.json` (not created or deployed), validates through `daily-card/public-record-adapter.mjs`, and updates aggregate headings only. If the file is missing, malformed or unaudited, the existing static historical record stays visible. Charts and tables intentionally remain historical and are labeled as such on overlay. This is a **read-only integration hook**, not a live data feed or server-side verified publisher.

A future trusted build pipeline must construct the aggregate snapshot after a complete per-row overlap audit, ensure no private pick data, and certify the snapshot; a JSON `audited:true` flag alone is not proof of audit. The `throughDate` must be validated before any release.

## CI and preview
GitHub Actions run 43103075812: all four isolated suites passed. Run 43103075722: website validation passed on four Node/OS jobs. These runs precede the Phase 5 records.js edit; new commit CI is pending/unverified. No Vercel preview URL confirmed.

Production website, Supabase and historical records unchanged. Do not merge or deploy.
