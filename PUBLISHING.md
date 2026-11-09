# Manual public-pick preparation

This is the first reviewed, operator-assisted publishing path for the main website. It does not provide an online admin account, Premium access, live scores, automatic grading or sportsbook integration. A dated November 8, 2026 public results card is included from owner-supplied information.

## Prepare a public card

Keep drafts outside this public repository. An operator can use a private JSON draft with exactly these fields:

```
id: unique lowercase letters/numbers/hyphens (3–64 characters)
audience: public
sport: NFL, NBA, MLB, NHL, NCAAF, NCAAB or WNBA
category: Top 3, Play of the Day or Dog of the Day
selection: full selection, including spread/total when applicable
odds: integer American price, such as -110 or 150 (not a spread)
stakeUnits: positive unit stake, at most 100
eventStart: ISO UTC timestamp including seconds and Z
reasoning: public explanation (maximum 1,200 characters)
```

Run `node scripts/prepare-pick.mjs record PRIVATE_DRAFT_PATH` from the repository root. This validates and appends to `content/public-picks.json` locally; it never commits or publishes. Only explicitly public data is accepted. Premium audiences/categories and unknown fields are rejected. Do not place Premium drafts in this repository or submit them to this command.

Run `npm run dev` to inspect the rendered card and `npm run check` plus `npm run build:check` to validate it. Review the exact content diff in a PR, including the audience, event time, price and wording, before releasing it through the main website's existing process. Preparation time is not website publication time. Recheck that the event is still in the future before deploying a new pick; a delayed deployment can publish after an event begins. Do not represent such a pick as pre-event verified.

The build reads the validated ledger and renders static HTML. Only the five existing public assets enter dist; drafts, content JSON, tools, local lock files, databases and secrets are not served. Public picks themselves are public repository history once committed. Nothing submitted here can later be made private by removing its card.

## Results and corrections

After an event starts, use `node scripts/prepare-pick.mjs grade PICK_ID Loss "PUBLIC_REASON"` (or Win, Push, Void). Verify the completed result before grading: the tool checks the supplied event start, not whether a game has finished. The reason appears publicly. Corrections append the previous result, new result, time and reason. Original betting details are preserved. The tool has no edit/delete/hide action. A file lock serializes ordinary local preparation; atomic replacement protects against partial writes.

These checks are operator-workflow guardrails, not tamper-proof or server-enforced verification. Repository administrators can edit JSON and clocks. Recorded and grading times come from the operator's machine. No independently verified publication, bet execution, event time or final result is claimed.

## Current boundaries

- The board retains all public cards with results; it does not automatically label an old card as today's pick.
- Existing imported historical graphs remain unchanged. Combining new results requires an explicit cutoff, overlap check and opening-balance reconciliation; it is not implemented here.
- Premium entry and grading belong in a separately authenticated, private backend. Staging/account work remains paused. No public admin form or private-data store is added.
- Production and the separate TFI Live Tracker are not changed by preparing or testing this branch.

## Post-event dated results card

content/public-results.json is a separate, strictly validated public-only format for owner-reported entries supplied after games began or finished. It preserves the event date in Eastern Time, null publication time and unknown stakes. The November 8 card has three reported wins and one unconfirmed result. Stale in-progress scores are not displayed as live scores. Premium selections remain outside this repository. No category membership is inferred and historical totals remain unchanged. New result updates must retain the previous content in reviewed Git history; a dedicated structured result-correction flow for these imported cards is not implemented.
