# Phase 3 — sandbox identity linking and staging preparation

## Infrastructure result

The owner selected the existing **The Favorite Index** organization for a separate `tfi-tracker-staging` Supabase project. Creation was attempted in us-east-1 and rejected because the owner already administers two active free projects. No project was created. Neither production project was paused, deleted, upgraded, or modified. No payment or plan upgrade is authorized by this branch.

Hosted provisioning and the durable hosted datastore adapter remain incomplete. A paid-capacity decision or a different authorized organization is needed; do not reuse Live Tracker or Comic Index resources to avoid this limit.

## Implemented

- Confidential server-side authorization-code exchange with PKCE S256, random state, nonce and independent browser binding, restricted to **Whop sandbox** endpoints.
- Linking starts through a same-origin POST in an authenticated tracker session less than five minutes old. State/verifier/nonce live server-side for ten minutes. Browser receives only an opaque HttpOnly SameSite=Lax callback-binding cookie. The ordinary tracker session remains Strict.
- Callback consumes the request once, verifies browser binding, and checks that the original session remains valid before and after provider requests. This works even when the cross-site callback does not send the Strict tracker cookie. Logging out destroys pending requests and blocks linking during an in-flight exchange.
- The server exchanges the code with the configured sandbox client secret, checks provider-delivered nonce/audience/expiry/subject and calls the fixed sandbox userinfo endpoint. Identity is taken only from that authenticated server-to-server exchange; no client JWT, email or claimed Whop user ID is accepted. This is not a general ID-token signature verifier. ID tokens are never accepted from a client or used in place of userinfo.
- Access/refresh tokens and personal profile fields are neither persisted nor returned. A link stores only the confirmed sandbox provider user ID. Linking grants no paid access by itself. Existing links cannot transfer automatically to another tracker account.
- Membership API reads now use only sandbox-api.whop.com, never the production API. Store startup explicitly marks its sandbox environment and refuses unscoped legacy billing rows until reviewed. Environment IDs/secrets look similar across Whop environments, so the operator must source every configured value from the sandbox.
- Optional local configuration activates account-linking and the billing queue only when supplied explicitly. An optional local worker reconciles known memberships and processes up to 20 queued jobs every ten seconds. It remains loopback-only and is not a hosted scheduler.
- Static Vercel output remains the exact eight-file preview allowlist. OAuth, configuration, billing, account records and keys never enter the static bundle. The connection control appears only in account-enabled mode when the server reports configured sandbox linking.

## Local sandbox configuration

Use a disposable local database and test accounts. Keep values in an ignored `.env.local` file, never chat or source control. Run `node --env-file-if-exists=.env.local tracker/server.mjs`. Do not expose or tunnel this server.

Required for linking: `WHOP_SANDBOX=true`, `WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET`. The local callback must be registered as exactly `http://127.0.0.1:4174/api/oauth/whop/callback`; the sandbox app needs `oauth:token_exchange` permission. Scope requested is `openid profile`; email is not collected.

Optional billing receiver: sandbox `WHOP_WEBHOOK_SECRET`, `WHOP_ACCOUNT_ID` and at least one explicitly approved `WHOP_TRACKER_PRODUCT_ID` or `WHOP_ALL_ACCESS_PRODUCT_ID`. The product IDs must be distinct. `WHOP_SANDBOX_API_KEY` enables current sandbox membership reads and the local reconciliation worker. Product slugs, prices, browser callbacks and emails never grant access.

All values must belong to a separate sandbox app/business. A production secret has no distinguishable key prefix; configuration flags alone cannot detect an operator pasting the wrong secret. Do not configure actual values until their sandbox ownership is verified. The launch script rejects production mode and non-loopback origins. Hosted HTTPS, Secure cookies and durable hosted scheduling require a separate implementation.

## Verification boundaries

Tests simulate the provider over an injected transport and exercise replay, wrong-browser, nonce/audience/expiry/subject mismatch, old sessions, logout races, duplicate links, denied production configuration, HTTP callback cookie behavior, non-leaking responses and all previous ledger/billing rules. They do not demonstrate real Whop consent, real token exchange, a registered callback, cloud persistence, or real delivery. Those need the sandbox app and hosted staging after the capacity decision.

References checked 2026-11-08:
- https://whop.com/blog/add-user-authentication/ — official sandbox OAuth/PKCE, token and userinfo flow.
- https://docs.whop.com/llms.txt — production and sandbox separation; credentials share formats.

## Next work

Resolve isolated database capacity with required approval; provision only the selected staging project. Build and test the durable hosted store, server authorization, HTTPS cookies, callback route and scheduler there. Create or connect the Whop sandbox app with required permission approval, set server-side secrets through an authorized secret-management flow, and run real consent/token/member-delivery tests. Complete recovery, privacy removal, backups and accessibility testing before any paid or production rollout. Keep PR #2 Draft.
