# Public results connection — review branch

The main website can read the existing TFI Live Tracker public feed through GET /api/public-feed?date=YYYY-MM-DD. It does not call the grading endpoint, store a grader token, create another scheduler, or write to the database. Live Tracker production code and database configuration are unchanged.

## Privacy boundary

The server requests the existing public configuration endpoint on a fixed HTTPS origin. It accepts only the known database origin and a publishable/legacy anon key, refusing secret/service-role keys. No incoming browser authentication or cookies are forwarded. The data request is fixed to tfi_public_feed, with exact public fields, event-date filter, the three Top 3 category labels and a 100-row maximum. Requests cannot select a source URL, table or arbitrary columns. Redirects are refused; response bodies and request duration are bounded. Rows with unexpected categories, dates, IDs, prices or statuses fail closed. The response projects public fields only; upstream details and keys are never returned.

Read-only inspection of the existing database found RLS enabled on the private picks and public-feed tables, admin-only private-pick read policies, and a trigger that copies only Top 3 #1/#2/#3 into the public table. Current public-feed category counts were 5, 3 and 3 respectively. The public table's anonymous read policy permits its rows; it therefore depends on correct writes to that separate table. This connection adds a server-side category filter and validates the returned categories, but is not a full production security certification or anonymous-role integration test. It makes no changes to grants, policies, triggers or credentials.

## Display and limitations

The website requests a date in America/New_York, initially the visitor's current Eastern date. It checks every 60 seconds while visible, offers a manual refresh and avoids overlapping requests. All content is rendered as text. Errors clear previous feed rows and identify dated reported cards as separate snapshots. A successful empty response says no connected picks exist for that date, not that the feed failed. The retrieval time is not a publication time, result-verification time or grader heartbeat.

The source contains recorded grading results rather than an in-game scoreboard. GitHub scheduling and upstream providers can delay final grading. Pending rows stay pending. Historical graphs and dated owner-reported snapshots are not automatically changed or combined with these rows. Matching or inserting the owner's November 8 card is not part of this read-only connection: that date had no private pick rows when inspected, and no Top 3 ranks were supplied. Do not invent ranks, opponent identity, stakes or pre-event publication times. An extra public pick outside the ranked Top 3 needs a separately reviewed source rule; do not label it Top 3 solely to expose it.

## Deployment and verification

The static build contains six allowlisted browser assets. The root api/public-feed.js is a separate Vercel Node function importing lib/public-feed.mjs; neither module enters static dist. The local preview server supports the same GET route. No new environment secret is required. Existing config and upstream runtime availability still need verification on the protected branch preview before production release. Do not expose config values or private rows while inspecting it.

Tests use synthetic upstream transports for fixed-origin/table requests, key rejection, response limits, date boundaries, public projection, method/query denial, generic failures, safe DOM rendering, stale clearing and hidden polling. They do not prove hosted API deployment, actual anonymous feed permissions or future grading uptime.

References checked November 8, 2026:
- https://vercel.com/docs/functions/runtimes/node-js — root api functions.
- https://supabase.com/docs/guides/getting-started/api-keys — publishable/secret key boundary.
- https://supabase.com/docs/guides/database/postgres/row-level-security — anonymous access policies.

The existing grader resumed successfully after the owner's GitHub billing update: retry of run 42550600663, attempt 3, and a successful live audit at 2026-11-09T02:51:14Z (November 8, 9:51 PM Eastern), checked 1, graded 0, skipped 1, errors 0. That demonstrates a successful invocation and heartbeat, not that a newly supplied November 8 selection was graded.
