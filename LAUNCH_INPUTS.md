# Remaining launch inputs

This is the current decision checklist for PR #5. It records what must be settled; it does not supply approvals, legal advice or authorization to publish. Keep approval references public-safe. Do not put credentials, private messages, member selections or raw workbooks in this public repository.

## Confirmed owner decisions

Approval reference: WHOP-PLAN-PRICE-01. The owner answered yes to confirming the existing Whop plans and prices: All Access at $35.99/month and Premium at $9.99/month. The owner explicitly directed that publication and deployment remain blocked. Scope is plan names and displayed prices; additional decisions are recorded separately below.

Approval reference: BRAND-CONTENT-01. The owner answered yes to approving the current branding, public website copy and historical-result disclosures in PR #5 at commit b5f03924d0fc8a96a84512d04033f1ca3344823b (index.html blob b26dd901178915756217bb1573e17330a386078c). No copy changes were requested. This applies to the current presentation and disclosures; it does not verify historical outcomes independently, approve future picks, or lift either hold. Legal/privacy review remains a separate pending input.

Approval reference: PUBLIC-PICK-APPROVAL-01. The owner confirmed that every individual public pick requires the owner's individual approval before appearing and that private/member picks are excluded. Both publication and deployment remain explicitly blocked. This establishes the approving person and per-pick eligibility rule, not permission to publish any actual entry. Previously approved public historical aggregates are unchanged; individual private selections remain excluded.

Approval reference: PUBLIC-PICK-TIMING-01. The owner confirmed that approved public picks must be posted only before the event starts, with UTC publication times and no backdated entries. Both holds remain explicitly blocked. A pick's publishedAt must represent its actual first public release, not an earlier analysis, private message, approval or event time. This rule is for future individual public picks; it does not relabel imported historical aggregates as pre-event publications.

Approval reference: PUBLIC-PICK-SOURCES-01. The owner selected DraftKings for recorded odds (the submitted draftkigs was interpreted as DraftKings) and ESPN as the reference for final results. This is a source-selection decision, not permission to connect accounts, scrape services, use an undocumented feed or publish. Source-specific capture details and settlement/correction rules remain pending. Both holds stay enforced.

Approval reference: PUBLIC-PICK-PRICE-01. The owner confirmed that DraftKings odds must be recorded when each approved public pick is first posted, that the original price must be preserved, and that later corrections must be recorded separately. Subsequent market movement must not replace the original recorded price. The capture/correction implementation remains behind the empty-content hold; no real prices or picks are added by this approval. Both holds remain enforced.

## Owner decisions and evidence

| Input | Current implementation/evidence | Exact remaining decision or record |
| --- | --- | --- |
| Whop membership | Owner confirmed the existing plan names and displayed prices in this chat: All Access $35.99/month and Premium $9.99/month. Existing links are retained. | No plan/price change requested. Retain https://whop.com/x-63cc/tfi-all-access/ and https://whop.com/x-63cc/tfi-premium/; include these existing destinations in the final pre-release link check. This records plan/price approval, not a new independent checkout/ownership verification or permission to publish. |
| Brand and public content | Owner approved the current branding, public copy and historical-result disclosures at b5f03924d0fc8a96a84512d04033f1ca3344823b; see BRAND-CONTENT-01. | No changes requested to the approved version. Obtain fresh approval for substantive future copy, identity, historical-scope or disclosure changes. This approval does not replace the separate legal/privacy decision or authorize publication. |
| Public-pick eligibility and approval | Owner confirmed individual owner approval for every public pick, with private/member picks excluded; see PUBLIC-PICK-APPROVAL-01. The content file remains empty. | Pre-event-only release, UTC publication times and no backdating are owner-confirmed (PUBLIC-PICK-TIMING-01). Before a future hold-lifting change, implement actual-first-publication evidence and define the public-safe approval-record process and allowed public fields. Each actual pick must have its own genuine owner approval; the general policy and publicApproved=true do not substitute for that approval. |
| Odds and grading | DraftKings odds and ESPN final-result reference are selected (PUBLIC-PICK-SOURCES-01). Capturing odds at first public posting, preserving the original price and recording later corrections separately are confirmed (PUBLIC-PICK-PRICE-01). | Define DraftKings market/location context and implement timestamped source evidence and original-price/correction records. Still needed: settlement timing; push/void/postponement rules; result-correction/withdrawal details and public revision evidence; whether stakes/units will be shown. No source feed is connected or ROI claim added. |
| Legal/privacy copy | General uncertainty/age/local-law language exists; no collection form, analytics, cookies or private backend is added by this PR. | Supply or approve applicable final terms, privacy and responsible-wagering copy, where each should appear, and any public contact/entity details required by the intended launch. Confirm the statement about site data practices and external Whop checkout matches the intended behavior. Do not invent contact details or jurisdiction-specific requirements. |
| Hosting and domain | Git deployment is disabled by this branch's vercel.json; a previously hosted version may still exist. | Identify the intended hosting project/environment, approved deployment method, canonical domain and DNS owner. Confirm redirects and whether thefavindex.com should connect. Credentials/DNS changes are outside this review packet. |
| Release authorization | PR #5 remains a draft; neither hold has been lifted. | Separately authorize merge and publishing scope, audience, environment/domain, exact release commit and rollback plan. Any change lifting the content or deployment hold needs its own review and validation. |

## Engineering work still outstanding

- Before enabling entries, implement DraftKings price capture tied to actual first public posting, retain the original odds, and store corrections separately. A plain editable odds field is not an append-only audit record. Source evidence must be public-safe; no account or private tracker data is needed.

- Before enabling real entries, capture trustworthy actual-first-publication evidence in UTC. The current validator checks UTC timestamp syntax and publishedAt < eventAt; it cannot prove that a supplied timestamp reflects a real public release or prevent false backdated claims by itself.

- Screen-reader pass for named landmarks, card headings, changing sports content and historical tables.
- Firefox/Safari and physical-device checks for navigation, cards, charts/table alternatives and membership links.
- Complete forced-colors traversal and another system palette. Targeted emulation is already documented.
- Final current-commit Actions success and content/link review before a separately authorized release.

## What is not needed to finish PR #5 review

No private picks, tracker credentials, database connection, raw workbook or live data feed is required. No new Whop URL is required if the implemented destinations are confirmed. The renderer, validation, preview tooling, safety checks and documented Edge 400% section review are already built.

The next owner-dependent phase is to resolve the decisions above. Until then, safe development can improve independent accessibility coverage or review tooling while preserving both holds.
