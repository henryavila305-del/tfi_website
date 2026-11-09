# Daily entry and record updates — coordinated review release

Enter daily selections in the existing private Live Tracker `/admin` dashboard, not in the main website's static content file. The paired tracker branch distinguishes Main Top 3 from separate NFL/NBA/NHL Top 3 records, retains Premium privacy, checks for duplicate entries and uses Eastern event dates. The existing protected grader remains the only automatic grader. Unsupported, ambiguous or unfinished games can remain pending and need review.

This website adds GET `/api/public-record`, a fixed-origin read-only proxy for the tracker's proposed `/api/public-records` endpoint. That tracker endpoint is disabled by default pending release approval. It reads only IDs/categories/dates/statuses and returns four cumulative count series; it does not read or return Premium selections, teams, odds, stakes or credentials. The main proxy validates category order, cutoff, coherent cumulative totals, dates and percentages, caps response size and projects a minimal aggregate response. Arbitrary query parameters and writes are rejected.

The browser checks the aggregate endpoint once per minute while visible. It updates all four category totals, percentages, SVG graphs and accessible cumulative tables. On unavailable/stale data it restores the original imported record panels and explicitly says daily updates are unavailable. The existing category selector continues to operate on the same panel nodes. Public picks still use the separate anonymous Top 3 feed. Dated owner-reported cards remain separate snapshots and are not assumed to have been posted before an event.

## Coverage and reconciliation

Imported baselines retain their original category cutoffs. Daily source rows are included from November 8, 2026 onward. Missing dates between each historical cutoff and that start are excluded and disclosed. November 2–3 public-feed entries were not classified as main versus sport-specific and are not automatically added. November 8 Broncos/Giants/Bruins appear in the reported card only until source entries, actual stakes and slot mapping are reviewed. Patriots belongs to the separate NFL Top 3 and stays excluded from the main card. No production rows are inserted, edited, reclassified or deleted in this branch.

The overall category rates use wins divided by wins plus losses; pending/void outcomes are excluded. This change does not add ROI or profit claims to incomplete imported pricing history. Public category records can overlap and must not be summed into a combined wager count. Duplicate daily slots or incomplete source history cause an unavailable response rather than misleading totals. Source result corrections recompute the current series; this is not an immutable public correction audit.

## Release gates

1. Verify both repositories' tests and preview behavior, including admin auth, source privacy, Eastern dates, normal/empty/failed/stale updates, category switching and public graphs.
2. Reconcile all source records from the daily start, including the currently absent November 8 main picks; do not invent stakes, ranks or publication times. Review gaps and keep all original history intact.
3. Approve deployment and the explicit enablement of the tracker's aggregate endpoint in the appropriate environment. This is a new public aggregate-only route; it remains off until authorized. No secret is copied to this website.
4. Verify the hosted main proxy and graphs against the enabled source before approving production merge/deployment. Neither draft is production ready merely because CI passes.

The static build now contains seven allowlisted browser assets. API functions and server helpers are separate from dist. Tests cover aggregate projection/arithmetic, stale fallback, DOM update paths, existing private boundaries and original historical snapshots. Local browser access and protected-preview access remain limited; CI does not prove a hosted admin save or a live new settlement.
