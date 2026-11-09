# Synthetic correction history review — November 9, 2026

Implementation begins from PR #5 head 21ad87dca409261c5b6e345cee5e864783434fe9.

Completed automated checks:
- Exact correction fields, individual correction approval/reference, safe reason text and canonical ordered UTC times.
- Value-chain continuity from original odds/result through multiple corrections; rejected no-ops, invalid odds/results, unknown/private fields, missing fields, pre-publication or pre-event grade revisions.
- Original base odds and result are not mutated by validation, statistics or rendering.
- Static ordered history shows escaped old/new values, reasons and time elements without approval metadata. Corrected result drives the public-board record; original odds remain labeled and visible. Withdrawn records stay excluded.
- Actual-template full-page fixtures with and without scripts retain correction history, named articles, valid IDs/ARIA, local assets and unchanged historical markup. A long correction reason also appears in the narrow synthetic withdrawal fixture.
- Existing empty-content/direct-build and deployment-hold checks remain mandatory.

Source review: history uses h4 beneath each card h3, a native ordered list and time elements; it adds no interactive controls. Existing card wrapping and system-color text rules apply to correction paragraphs. No new browser rendering or screen-reader checks were performed. Narrow-width wrapping, keyboard/focus around cards, forced-colors palettes, zoom and spoken reading order remain unverified for this slice. Earlier card browser evidence does not cover correction history.

Limits: this does not establish actual approval or source authenticity, nor detect deletion/rewrite of records across versions. Trusted approval capture, original-source evidence and append-only retention remain required before real entries can be enabled. No feed, tracker, private picks, profit metrics, publication, deployment or hosting changes are included.

## Correctness follow-up

Source review found inconsistent American-odds notation: positive original odds displayed a plus sign, while positive values in correction history omitted it. The renderer now uses the same signed notation for original and corrected odds, including changes across negative/positive prices.

Additional regression checks exercise interleaved odds and result corrections, preserved chronological rendering, independent per-field chains, deep-frozen source inputs, cross-pick statistics and rejection of base values inconsistent with the correction chain. These checks do not prove immutability between source-file versions; the durable-retention gate remains.

## Prior-snapshot retention follow-up

Added a read-only transition validator and explicit-path CLI. Regression tests reject deletion/renaming of old picks, changed original odds/results or withdrawal evidence, removed/truncated corrections, rewritten reasons/timestamps/approval references, reordered same-time independent corrections, and self-consistent base/history rewrites. Valid appends, unchanged/frozen snapshots, reordered JSON keys and multiple pick records pass. CLI tests run only against an isolated temporary directory and verify unchanged real publication content.

This provides a comparison against a supplied prior snapshot, not immutable storage. A trusted complete baseline and mandatory use in any future publication path remain unimplemented. Ordinary base-result updates, including transition into withdrawal, fail closed; a future event-based withdrawal lifecycle must preserve existing base/history instead.

## Retention review: distinct baseline files

Found and fixed a CLI gap: supplying the candidate file as both arguments previously passed, without comparing against an independent prior snapshot. The CLI now requires regular files and rejects matching resolved paths or matching filesystem device/inode identities, including hard-link aliases. Reads use the inspected open handles and handles close on failure.

Added regression checks for same-path/path-alias/hard-link self-comparison, distinct files with unchanged records, malformed JSON, invalid prior contract and directory inputs. The tests use isolated temporary synthetic files and preserve real empty content. A separately copied or otherwise untrusted baseline still cannot be authenticated by file identity; trustworthy baseline selection and retention remain release gates.

Local permission restrictions prevent the temporary hard-link fixture from being created; only that regression is reported as unavailable locally. CI must create and exercise it (CI environments do not skip it). No filesystem permissions were changed to run the test.
