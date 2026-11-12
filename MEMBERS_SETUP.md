# Members Live Board — isolated preview

No production changes or database migrations. Real picks cannot load until Whop sign-in and server-side access checks succeed. A static page is only the login shell; paid selections are never baked into HTML or JavaScript.

Access mapping: TFI Premium → Main Premium. All Access → Main, NBA, NHL, NFL, NCAAF, NCAAB Premium. Product IDs must be distinct, match the actual existing Whop products, and belong to the same environment as the API keys. No new subscriptions are created.

## Preview environment setup

1. In Whop's developer dashboard, create/configure a TFI website OAuth app. Register the exact stable preview callback URL: `https://PREVIEW_HOST/api/member-callback`.
2. Add the app permission `oauth:token_exchange`. Obtain the app client ID and client secret. Use a company API key with the least read access required for `users.checkAccess` to the two products. Follow Whop's app/company permission UI; do not grant write permissions.
3. Set only on the Vercel preview branch environment: `MEMBER_APP_URL` (https origin), `WHOP_CLIENT_ID`, `WHOP_CLIENT_SECRET`, `WHOP_COMPANY_API_KEY`, `WHOP_PREMIUM_PRODUCT_ID`, `WHOP_ALL_ACCESS_PRODUCT_ID`, `MEMBER_SESSION_SECRET` (random 32+ characters), `WHOP_MEMBERS_ENABLED=true`. For sandbox testing also set `WHOP_SANDBOX=true`; never mix sandbox and production identities/product IDs.
4. For isolated pick reads use a staging database with synthetic rows and set server-only `SUPABASE_URL` and `SUPABASE_SECRET_KEY` only in this Vercel branch's preview environment. Do not copy a production database secret into the preview. No `NEXT_PUBLIC_` keys. Do not paste any secret in chat or commit it. Existing public database policies remain untouched. Without a staging target, the transport-mocked tests verify the read boundary; real database acceptance stays pending.
5. Redeploy preview and test: logged out, active Premium, active All Access, revoked membership, failed Whop lookup, sign-out, mobile layout and actual live scoreboard. Verify paid API responses are never cached and no private selections load for denied users.
6. Real-member acceptance and production launch are pending. Public homepage has no members link until reviewed.

Tokens are used only server-side during OAuth; only Whop user ID and sign-in timestamp are retained in a sealed Secure HttpOnly cookie. State/nonce/PKCE are short-lived. Product access is checked fresh on every 30-second refresh; failed membership lookups clear displayed cards. Hiding the page clears its cards and returning revalidates access. Sign-out clears both member and login cookies even when Whop is unavailable; a late pick response cannot redraw the board after sign-out. No units are returned.

The identity cookie lasts one hour. This is browser-cookie sign-out, not central session revocation: a previously copied cookie remains usable until expiry, and a concurrent callback request already running on the server is not centrally invalidated. Entitlements still require a fresh Whop check on every picks request. Production acceptance must include these session limits; no durable session store or live billing webhook is introduced.

## Validation commands

Run `npm ci --ignore-scripts`, `npm run check`, and `npm run build:check`. The cross-platform workflow now installs the exact committed dependencies before checks. The additional 18 Node tests use synthetic identities and mocked provider/database transport; they do not sign into Whop, charge anyone, write picks, or claim real-member acceptance.

For a local unavailable-state review, `npm run dev` serves `/members.html` and the real member handlers. With no preview secrets the endpoints deny private reads and the sign-in action returns an explanatory member-page notice. The local server binds only to loopback.

Official references: https://whop.com/blog/add-user-authentication/ and https://whop.com/blog/add-paywall/

