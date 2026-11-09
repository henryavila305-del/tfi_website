# Premium Tracker — isolated beta foundation

This branch extends `tfi_website`. It does not modify the separate TFI Live Tracker, hosted databases, DNS, billing products, or production branch.

## Two modes

- **Vercel branch preview `/tracker/`:** read-only synthetic design example. No signup, saved picks, API, payment processing or live feed is represented as working there. Static output contains eight allowlisted files only.
- **Local beta:** Node 22.13+ (24 recommended), built-in SQLite, password hashing and server sessions, ownership and entitlement enforcement, manual picks, grading, retained public history and units graphs. Binds to `127.0.0.1` only and rejects other Host headers. Do not expose it on the internet.

## Run locally

1. Run `node tracker/server.mjs`.
2. Open `http://127.0.0.1:4174/tracker/`. Create a test account with a new disposable password and sign in.
3. For an operator-managed test account only, run `node tracker/grant-local.mjs HANDLE tracker 7` (or `all_access`). This grants local test access, not a purchase or verified Whop entitlement.
4. Enable the public profile if desired, then add a pick. Stake is measured in units; this version does not collect dollar bankroll details.

Records live in `.tracker-data/beta.sqlite`, ignored by Git and excluded from the static build. Never use real customer credentials in this beta. Recovery, removal, remote backups and production persistence are not implemented.

## Implemented product rules

- Planned standalone price: $19.99/month; included in $35.99/month All Access. Picks-only Premium does not unlock tracker access. Billing is not connected.
- Expired access retains private read access but blocks writes. Previously published history remains public.
- Private picks and audit snapshots are owner-only. Free public profiles expose published picks, units and result history, without internal user IDs.
- Server clock sets publication/audit times. Publication is rejected at/after the supplied event start or after grading. Public profiles must be enabled first.
- Betting details are immutable after entry in this beta. This is stricter than an event-start lock. There is no edit, deletion or hide endpoint.
- Event times and results are supplied by the user. Publication timestamps do not verify an event time, an executed wager or an independent result. All records are labeled **self-reported**.
- Private late entries are labeled and cannot become pre-event public picks.
- Corrections preserve the original settlement position and append the previous result, replacement, time and reason. Public grading reasons are public, as disclosed in the form. Graphs show the corrected current record.
- Win percentage excludes pushes, voids and pending. ROI includes win/loss/push stake and excludes void/pending. Profit uses decimal odds; American odds convert on entry.
- Profiles with published picks cannot be hidden in-app. Production needs a reviewed privacy/account-removal process; this beta does not override privacy obligations.

## Security and limits

Prepared SQL; random session secrets stored as hashes; salted scrypt password hashes; HttpOnly/SameSite=Strict cookies; same-origin POST checks; local Host validation; bounded JSON bodies; login/signup rate limits; text-only user content rendering; self-only CSP; ownership checks on every pick operation; no HTTP access-grant route. Static output excludes server code and records.

This is not a security certification. SQLite triggers prevent ordinary in-app audit mutation, not administrator file edits. Local HTTP cookies have no Secure flag; hosted sessions require HTTPS and Secure cookies. The local server is single-process with no recovery, MFA, email verification or external security review. Production needs durable rate limiting, session operations and backup/restore. There is no subscription webhook, live score feed, automated grading or sportsbook integration.

## Verification

Run `node --test tracker/test/*.test.mjs`, `node scripts/check.mjs`, `node scripts/check-interactions.mjs`, and `node scripts/check-build.mjs`.

Tests cover grading, isolation, IDOR, expired access, late publication, retained losses/corrections, session revocation, CSRF and output boundaries. GitHub's Node 22/24 Linux/Windows matrix runs the full suite. Local execution blocks loopback connections; domain/store checks run locally, and HTTP results must come from CI rather than being claimed as a local pass.

## Before a hosted paid beta

Choose an isolated staging identity and durable database with tested ownership rules and server-side sessions. Do not put this SQLite server in Vercel ephemeral functions. Wire Whop signature verification, replay protection, idempotency, expiry/cancel/refund handling and revocation. Create billing products only after review. Add recovery, privacy export/removal, backups and restore tests, abuse controls, safe logs, dispute handling and cross-device accessibility QA.

Then recruit 5–10 cappers and a few private trackers. Measure first-pick completion, weekly logging, profile sharing, grading completion, support burden and voluntary renewal at $19.99. These are proposed test goals, not existing customers or revenue. Synthetic fixtures must never be presented as marketing performance.
