# Staging integration status — 2026-11-08

Branch: `feature/premium-tracker-beta`, draft PR #2. Production is unchanged.

## Completed in this phase

1. A disabled-by-default Whop receiver verifies raw-body HMAC signatures, a five-minute delivery window, the business account, webhook/message identity and dated API shape. It rejects duplicate security headers. Only membership activation/update events enqueue work; unknown signed event types are ignored.
2. The durable SQLite queue deduplicates delivery IDs, retries failed verification, and uses expiring worker leases and fencing tokens. A worker reads the current membership from the fixed Whop API origin with a dated API header, a timeout and redirects disabled. Access is never granted from event payload fields alone.
3. Memberships must match an allowlisted Tracker or All Access product and a separately verified provider identity. No browser endpoint can bind a Whop identity or grant access. No email matching or checkout redirect is accepted as proof.
4. Access is leased for at most one hour and no longer than the provider's current billing period or fixed expiration. Unrecognized products/statuses, missing dates and expired periods grant no access. Scheduled cancellation retains access through the paid period; canceled/paused/past-due/expired snapshots revoke. API failures never issue a new grant. Older snapshots cannot override newer state; equal-version revocation wins. Multiple memberships can independently supply access.
5. A reconciliation scheduler entry point queues known memberships once per ten-minute bucket. It is not running on any remote service. Production requires a scheduled worker; missed webhooks and outages will otherwise cause access to expire safely.
6. Owner-only JSON export includes private and public picks and audit history, excludes passwords and sessions, and remains available after membership expiry. Public profiles cannot export another user's private data.
7. Inclusive UTC event-date filters apply consistently to the graph, metrics, sport breakdown and ledger. Invalid ranges preserve the previous visible view with an error; Reset restores all records.

## What is deliberately not live

The receiver, worker and membership reader are implemented and tested with synthetic signed events and injected provider responses. No real Whop event delivery or membership read has been performed. No production secrets are configured. The local server still binds only to loopback, and the Vercel preview still contains static synthetic examples. All payments remain disconnected. There is no OAuth callback or verified customer account-linking flow yet.

The existing connected database projects belong to TFI Live Tracker and Comic Index; neither is a staging database for this product. Neither was changed. Creating a separate project requires an organization selection and any required cost approval. Do not reuse production credentials or tables to avoid that permission.

## Required next steps

- Provision a distinct staging datastore and identity environment after required organization/cost authorization. Port the store to that durable backend, run ownership and privilege tests against it, and keep staging credentials server-side.
- Implement verified Whop OAuth/PKCE linking and account recovery. A test operator binding is not customer identity proof.
- Configure actual approved product IDs and dated webhook subscription in staging. Never infer product IDs from public slugs, prices, emails or client fields. Tracker-only and All Access qualify; picks-only Premium does not.
- Register a public HTTPS staging receiver and scheduled durable worker. Do not tunnel the current local server or expose its password accounts. Isolate staging customer fixtures and verify real delivery/retry/revocation there.
- Test provider-confirmed refund/dispute policy separately. This phase grants only from current membership access, not payment or refund payloads. A refund that does not revoke provider membership is not independently handled yet; do not claim refund coverage or launch paid access until this is resolved.
- Complete recovery/privacy removal, backups/restore, production rate limits, customer support and browser account flow QA before accepting customers.

## Provider references

- https://docs.whop.com/developer/guides/webhooks — raw-body signatures, literal ws_ key, delivery windows, deduplication, version pins and unordered delivery.
- https://docs.whop.com/api-reference/memberships/retrieve-membership — current membership, account/user/product identity, status and period boundaries.

Tests use fabricated secrets with a `ws_` prefix and fabricated IDs. They are fixtures, not credentials. API credentials must never appear in tests, static output, logs or committed configuration.
