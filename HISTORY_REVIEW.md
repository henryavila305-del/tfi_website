# Main website historical records

This branch adds aggregate-only historical records to the main website. It is independent of draft Premium Tracker PR #2. No production merge, deployment, DNS, billing or database changes are part of this branch.

Four category summaries and cumulative win-percentage graphs match the owner-provided tracker workbook: Top 3 137–99; Premium 60–29; Dog 35–23; Play 24–31–2. Opening balances are included. Premium membership overlaps ten Top 3 entries, without creating extra wagers. Two voids do not enter win-rate decisions. Bonus parlays and the supplemental NFL summary are excluded.

The workbook and private import package remain outside this public repository. Public output contains aggregate cumulative counts only, with no selections, odds, sportsbook details, Premium picks, source URLs, account data or private chat identifiers. Source extraction and reconciliation were performed locally against 421 ledger rows and the workbook opening balances.

Historical data is labeled self-reported and imported, with different category coverage dates and missing dates disclosed. No claim of independent verification, executed bets, pre-event publication or live updating is made. Owner closed the missing-odds review because of vacation days; no replacement prices are assumed. Profit and ROI are withheld.

All four tables and charts are available without JavaScript. JavaScript adds category selection, keeping the selected graph and its accessible table together. Native table disclosures, chart titles/descriptions and a horizontally scrollable table region support keyboard use. The page retains existing navigation and approved Whop links. No tracker accounts or backend are added.

Validation: node scripts/check.mjs; node scripts/check-interactions.mjs; node scripts/check-records.mjs; node scripts/check-build.mjs. Review branch CI and browser rendering before production release.
